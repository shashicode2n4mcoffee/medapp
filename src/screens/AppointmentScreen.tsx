import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Colors} from '../theme/Colors';
import {RootStackParamList} from '../navigation/AppNavigator';
import Sidebar from '../components/Sidebar';
import {useSidebar} from '../context/SidebarContext';
import {useAppDispatch, useAppSelector} from '../redux/store';
import logger from '../utils/logger';
import {
  fetchAppointments,
  updateParams,
  createRecord,
} from '../redux/slices/appointmentsSlice';
import {
  Appointment as AppointmentType,
  GetAppointmentsParams,
} from '../api/appointmentService';
import {format, parseISO, subDays} from 'date-fns';
const micIcon = require('../assets/start.png');
const upcomingOff = require('../assets/upcoming-off.png');
const upcomingOn = require('../assets/upcoming-on.png');
const progressOff = require('../assets/progress-off.png');
const progressOn = require('../assets/progress-on.png');
const completeOff = require('../assets/export-off.png');
const completeOn = require('../assets/export-on.png');

type AppointmentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
};

// Local appointment display type
interface AppointmentDisplay {
  id: string;
  patientName: string;
  date: string;
  time: string;
  type: 'ECW' | 'Adhoc';
  status: string;
  age?: string;
  gender?: string;
}

// Helper function to format date as YYYY-MM-DD
const formatDateForAPI = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Helper function to get date parameters for API
const getDateRangeParams = (
  tabIndex: number,
): Pick<
  GetAppointmentsParams,
  'appointment_date_start' | 'appointment_date_end'
> => {
  const today = new Date();

  switch (tabIndex) {
    case 0: // Today
      return {
        appointment_date_start: formatDateForAPI(today),
        appointment_date_end: formatDateForAPI(today),
      };
    case 1: // Last 7 days
      return {
        appointment_date_start: formatDateForAPI(subDays(today, 7)),
        appointment_date_end: formatDateForAPI(today),
      };
    case 2: // Last 14 days
      return {
        appointment_date_start: formatDateForAPI(subDays(today, 14)),
        appointment_date_end: formatDateForAPI(today),
      };
    default:
      return {
        appointment_date_start: formatDateForAPI(today),
        appointment_date_end: formatDateForAPI(today),
      };
  }
};

const AppointmentScreen = ({navigation}: AppointmentScreenProps) => {
  const {isSidebarOpen, toggleSidebar} = useSidebar();
  const dispatch = useAppDispatch();  // Get appointments from Redux
  const {
    appointments = [],
    loading = false,
    error = null,
    total: totalAppointments = 0,
    record = null,
  } = useAppSelector(state => state.appointments || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0); // 0: Today, 1: Last 7 days, 2: Last 14 days
  const [selectedCategory, setSelectedCategory] = useState('upcoming'); // 'upcoming', 'progress', 'complete'
  const [displayAppointments, setDisplayAppointments] = useState<
    AppointmentDisplay[]
  >([]);
  // Map API appointments to display format
  const mapAppointmentsForDisplay = (
    apiAppointments: AppointmentType[],
  ): AppointmentDisplay[] => {
    if (!apiAppointments || !Array.isArray(apiAppointments)) {
      return [];
    }
    return apiAppointments.map(appointment => {
      // Parse appointment date/time, handle potential invalid dates
      let appointmentDate;
      try {
        appointmentDate = parseISO(appointment.appointment_time);
        // Check if date is valid
        if (isNaN(appointmentDate.getTime())) {
          appointmentDate = new Date(); // Fallback to current date
        }
      } catch (e) {
        appointmentDate = new Date(); // Fallback to current date
      }
      return {
        id: appointment.id.toString(),
        patientName: appointment.appointment_name || 'No Name',
        date: format(appointmentDate, 'MM/dd/yyyy'),
        time:
          format(appointmentDate, 'hh:mm a') +
          ' - ' +
          format(
            appointmentDate.setHours(appointmentDate.getHours() + 1),
            'hh:mm a',
          ),
        type: appointment.appointment_type === 'adhoc' ? 'Adhoc' : 'ECW',
        status: appointment.appointment_status,
        age: appointment.metadata?.age || '0',
        gender: appointment.metadata?.sex_at_birth || 'U',
      };
    });
  };

  // Load appointments from API when component mounts or when filters change
  useEffect(() => {
    // Get the date parameters based on selected tab
    const dateParams = getDateRangeParams(selectedTab);

    // Update the Redux state with new date parameters
    dispatch(updateParams(dateParams));

    // Fetch appointments from API
    dispatch(
      fetchAppointments({
        ...dateParams,
        limit: 30,
        offset: 0,
        order_by_desc: true,
      }),
    );
    // No need to set local state here as we'll handle it in a separate useEffect
  }, [dispatch, selectedTab]);
  // UseEffect to navigate when record is created successfully
  useEffect(() => {
    if (record) {
      logger.info('Record created successfully in state:', record);
      // Navigate to transcribe screen with appointment ID and record ID
      if (navigation) {
        navigation.navigate('Transcribe', {
          appointmentId: record.appointment_id.toString(),
          recordId: record.record_id.toString(),
        });
      } else {
        logger.warn('Navigation prop is not available');
      }
    }
  }, [record, navigation]);

  // Transform API appointments to display format when they change
  useEffect(() => {
    if (appointments && Array.isArray(appointments)) {
      const mappedAppointments = mapAppointmentsForDisplay(appointments);
      setDisplayAppointments(mappedAppointments);
    }
  }, [appointments]);  // Filter appointments by search query and status category
  const filteredAppointments = displayAppointments.filter(appointment => {
    logger.debug('Filtered Appointments:', appointment);
    // Filter by search query
    if (
      searchQuery &&
      !appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    } // Filter by status category
    if (selectedCategory === 'upcoming' && appointment.status !== 'scheduled') {
      return false;
    } else if (
      selectedCategory === 'progress' &&
      appointment.status !== 'in_progress'
    ) {
      return false;
    } else if (
      selectedCategory === 'complete' &&
      appointment.status !== 'completed'
    ) {
      return false;
    }

    return true;
  });
  const renderAppointmentCard = ({item}: {item: AppointmentDisplay}) => {
    // Determine the border color based on the appointment status
    let borderColor = '#27AE60'; // Default green

    if (item.status === 'scheduled') {
      borderColor = '#27AE60'; // Green for upcoming
    } else if (item.status === 'in_progress') {
      borderColor = '#F2C94C'; // Yellow for in progress
    } else if (item.status === 'completed') {
      borderColor = '#2F80ED'; // Blue for completed
    } // Format for gender display
    const genderDisplay =
      !item.gender || item.gender === ''
        ? 'U'
        : item.gender === 'M'
        ? 'M'
        : item.gender === 'F'
        ? 'F'
        : 'U';

    return (
      <View style={[styles.appointmentCard, {borderLeftColor: borderColor}]}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.patientName}>
            {item.patientName} | {item.age} | {genderDisplay}
          </Text>
          <Text style={styles.appointmentTime}>{item.time}</Text>
        </View>
        <TouchableOpacity
          style={styles.voiceIconContainer}
          onPress={() => handleMicPress({appointmentId: item.id})}>
          <Image source={micIcon} style={styles.voiceIcon} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleTabChange = (index: number) => {
    setSelectedTab(index);

    // Update the date parameters in Redux state
    const dateParams = getDateRangeParams(index);
    dispatch(updateParams(dateParams));

    // Fetch appointments with new date parameters
    dispatch(
      fetchAppointments({
        ...dateParams,
        status: undefined, // Don't filter by status in API call
        limit: 30,
        offset: 0,
        order_by_desc: true,
      }),
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };
  const getCategoryCount = (category: string): number => {
    // Count appointments in each category from the API data
    const count = appointments.filter((appointment: AppointmentType) => {
      if (
        category === 'upcoming' &&
        appointment.appointment_status === 'scheduled'
      ) {
        return true;
      } else if (
        category === 'progress' &&
        appointment.appointment_status === 'in_progress'
      ) {
        return true;
      } else if (
        category === 'complete' &&
        appointment.appointment_status === 'completed'
      ) {
        return true;
      }
      return false;
    }).length;

    return count;
  }; // Interface for handle mic press function parameters
  interface MicPressParams {
    appointmentId: string;
  }  const handleMicPress = ({appointmentId}: MicPressParams): void => {    // Create a record first with the appointment ID
    const appointmentIdNumber = parseInt(appointmentId, 10);
    if (isNaN(appointmentIdNumber)) {
      logger.error('Invalid appointment ID:', appointmentId);
      return;
    }

    // Current date and time for start_time
    const currentDate = new Date();
    const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSS");

    // Prepare payload for create record API
    const recordPayload = {
      appointment_id: appointmentIdNumber,
      start_time: formattedDate,
      content_type: 'audio/webm',
      file_type: 'webm',
    };    // Only dispatch the createRecord action - navigation will happen in useEffect
    dispatch(createRecord(recordPayload))
      .unwrap()
      .catch((error: Error) => {
        logger.error('Failed to create record:', error);
        // Navigate as fallback in case of error
        if (navigation) {
          navigation.navigate('Transcribe', {appointmentId});
        }
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Sidebar
        isVisible={isSidebarOpen}
        onClose={() => {}}
        userInfo={{
          name: 'Dr. Smith',
          role: 'Doctor',
        }}
      />

      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar}>
            <Image
              source={require('../assets/menu.png')}
              style={styles.menuIcon}
            />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Welcome, Dr. Smith</Text>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity style={styles.notificationIcon}>
              <Image
                source={require('../assets/notification.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileIcon}>
              <View style={styles.profileIconBg}>
                <Text style={styles.profileIconText}>DS</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Image
            source={require('../assets/Search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search appointment"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              const dateParams = getDateRangeParams(selectedTab);
              dispatch(
                fetchAppointments({
                  ...dateParams,
                  limit: 30,
                  offset: 0,
                  order_by_desc: true,
                }),
              );
            }}>
            <Image
              source={require('../assets/reload.png')}
              style={styles.refreshIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['Today', 'Last 7 days', 'Last 14 days'].map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tabButton,
                selectedTab === index && styles.selectedTabButton,
              ]}
              onPress={() => handleTabChange(index)}>
              <Text
                style={[
                  styles.tabText,
                  selectedTab === index && styles.selectedTabText,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Selector */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'upcoming' && styles.selectedCategoryButton,
            ]}
            onPress={() => handleCategoryChange('upcoming')}>
            <View style={styles.categoryIconContainer}>
              <Image
                source={
                  selectedCategory === 'upcoming' ? upcomingOn : upcomingOff
                }
                style={styles.categoryIcon}
              />
            </View>
            <Text style={styles.categoryLabel}>Upcoming</Text>
            <Text style={styles.categoryCount}>
              ({getCategoryCount('upcoming')})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'progress' && styles.selectedCategoryButton,
            ]}
            onPress={() => handleCategoryChange('progress')}>
            <View style={styles.categoryIconContainer}>
              <Image
                source={
                  selectedCategory === 'progress' ? progressOn : progressOff
                }
                style={styles.categoryIcon}
              />
            </View>
            <Text style={styles.categoryLabel}>Progress</Text>
            <Text style={styles.categoryCount}>
              ({getCategoryCount('progress')})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'complete' && styles.selectedCategoryButton,
            ]}
            onPress={() => handleCategoryChange('complete')}>
            <View style={styles.categoryIconContainer}>
              <Image
                source={
                  selectedCategory === 'complete' ? completeOn : completeOff
                }
                style={styles.categoryIcon}
              />
            </View>
            <Text style={styles.categoryLabel}>Complete</Text>
            <Text style={styles.categoryCount}>
              ({getCategoryCount('complete')})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appointment List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentCard}
            keyExtractor={item => item.id}
            style={styles.appointmentList}
            contentContainerStyle={styles.listContentContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No appointments found</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 32,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 16,
  },
  icon: {
    width: 24,
    height: 24,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  refreshButton: {
    padding: 5,
  },
  refreshIcon: {
    width: 20,
    height: 20,
  },
  tabContainer: {
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedTabButton: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTabText: {
    color: 'white',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryButton: {
    alignItems: 'center',
    flex: 1,
  },
  selectedCategoryButton: {
    // Add any styling for selected category if needed
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIcon: {
    width: 24,
    height: 24,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  appointmentList: {
    flex: 1,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  voiceIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIcon: {
    width: 24,
    height: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});

export default AppointmentScreen;
