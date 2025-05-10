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
import {fetchAppointments, updateParams} from '../redux/slices/appointmentsSlice';
import {Appointment as AppointmentType} from '../api/appointmentService';
import {format, parseISO} from 'date-fns';
const micIcon = require('../assets/start.png');
const upcomingOff = require('../assets/upcoming-off.png');
const upcomingOn = require('../assets/upcoming-on.png');
const progressOff = require('../assets/progress-off.png');
const progressOn = require('../assets/progress-on.png');
const completeOff = require('../assets/export-off.png');
const completeOn = require('../assets/export-on.png');

// Import mock data
import mockAppointments from '../mock/mockAppointments';

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

const AppointmentScreen = ({navigation}: AppointmentScreenProps) => {
  const {isSidebarOpen, toggleSidebar} = useSidebar();
  const dispatch = useAppDispatch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0); // 0: Today, 1: Last 7 days, 2: Last 14 days
  const [selectedCategory, setSelectedCategory] = useState('upcoming'); // 'upcoming', 'progress', 'complete'
  const [loading, setLoading] = useState(false);
  const [localAppointments, setLocalAppointments] = useState<AppointmentDisplay[]>([]);

  // Get appointments from Redux (optional, we'll use mock data)
  const {appointments = [], error = null, total: totalAppointments = 0} = 
    useAppSelector(state => state.appointments || {});

  // Map API appointments to display format
  const mapAppointmentsForDisplay = (apiAppointments: AppointmentType[]): AppointmentDisplay[] => {
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
        time: format(appointmentDate, 'hh:mm a') + ' - ' + format(appointmentDate.setHours(appointmentDate.getHours() + 1), 'hh:mm a'),
        type: appointment.appointment_type === 'adhoc' ? 'Adhoc' : 'ECW',
        status: appointment.appointment_status,
        age: appointment.metadata?.age || '0',
        gender: appointment.metadata?.sex_at_birth || 'U'
      };
    });
  };

  // Load mock appointments when component mounts or when filters change
  useEffect(() => {
    const loadMockAppointments = async () => {
      setLoading(true);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter mock appointments based on selected tab (date range)
        let filteredAppointments = [...mockAppointments];
        const today = new Date();
        
        if (selectedTab === 0) { // Today
          filteredAppointments = mockAppointments.filter(apt => {
            const aptDate = new Date(apt.appointment_time);
            return aptDate.toDateString() === today.toDateString();
          });
        } else if (selectedTab === 1) { // Last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);
          
          filteredAppointments = mockAppointments.filter(apt => {
            const aptDate = new Date(apt.appointment_time);
            return aptDate >= sevenDaysAgo && aptDate <= today;
          });
        } else if (selectedTab === 2) { // Last 14 days
          const fourteenDaysAgo = new Date();
          fourteenDaysAgo.setDate(today.getDate() - 14);
          
          filteredAppointments = mockAppointments.filter(apt => {
            const aptDate = new Date(apt.appointment_time);
            return aptDate >= fourteenDaysAgo && aptDate <= today;
          });
        }
        
        // Map to display format
        const mappedAppointments = mapAppointmentsForDisplay(filteredAppointments);
        setLocalAppointments(mappedAppointments);
      } catch (error) {
        console.error('Error loading mock appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMockAppointments();
    
    // Also call the real API if needed
    dispatch(fetchAppointments());
  }, [dispatch, selectedTab]);

  // Filter appointments by search query and status category
  const filteredAppointments = localAppointments.filter(appointment => {
    // Filter by search query
    if (searchQuery && !appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by status category
    if (selectedCategory === 'upcoming' && appointment.status !== 'scheduled') {
      return false;
    } else if (selectedCategory === 'progress' && appointment.status !== 'in_progress') {
      return false;
    } else if (selectedCategory === 'complete' && appointment.status !== 'completed') {
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
    }

    // Format for gender display
    const genderDisplay = item.gender === 'M' ? 'M' : item.gender === 'F' ? 'F' : 'U';

    return (
      <View style={[styles.appointmentCard, {borderLeftColor: borderColor}]}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.patientName}>{item.patientName} | {item.age} | {genderDisplay}</Text>
          <Text style={styles.appointmentTime}>
            {item.time}
          </Text>
        </View>
        <TouchableOpacity style={styles.voiceIconContainer}>
          <Image
            source={micIcon}
            style={styles.voiceIcon}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const getCategoryCount = (category: string): number => {
    // Count appointments in each category from our mock data
    const count = mockAppointments.filter(appointment => {
      if (category === 'upcoming' && appointment.appointment_status === 'scheduled') {
        return true;
      } else if (category === 'progress' && appointment.appointment_status === 'in_progress') {
        return true;
      } else if (category === 'complete' && appointment.appointment_status === 'completed') {
        return true;
      }
      return false;
    }).length;
    
    return count;
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
            <Image source={require('../assets/menu.png')} style={styles.menuIcon} />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Welcome, Dr. Smith</Text>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity style={styles.notificationIcon}>
              <Image source={require('../assets/notification.png')} style={styles.icon} />
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
          <TouchableOpacity style={styles.refreshButton}>
            <Image
              source={require('../assets/filter.png')}
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
                source={upcomingOff} 
                style={styles.categoryIcon}
              />
            </View>
            <Text style={styles.categoryLabel}>Upcoming</Text>
            <Text style={styles.categoryCount}>({getCategoryCount('upcoming')})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'progress' && styles.selectedCategoryButton,
            ]}
            onPress={() => handleCategoryChange('progress')}>
            <View style={[styles.categoryIconContainer]}>
              <Image
                source={progressOff}
                style={[styles.categoryIcon]}
              />
            </View>
            <Text style={styles.categoryLabel}>Progress</Text>
            <Text style={styles.categoryCount}>({getCategoryCount('progress')})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'complete' && styles.selectedCategoryButton,
            ]}
            onPress={() => handleCategoryChange('complete')}>
            <View style={[styles.categoryIconContainer]}>
              <Image
                source={completeOff}
                style={[styles.categoryIcon]}
              />
            </View>
            <Text style={styles.categoryLabel}>Complete</Text>
            <Text style={styles.categoryCount}>({getCategoryCount('complete')})</Text>
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
  }
});

export default AppointmentScreen;
