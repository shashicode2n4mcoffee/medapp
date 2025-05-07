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
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../theme/Colors';
import {RootStackParamList} from '../navigation/AppNavigator';
import Sidebar from '../components/Sidebar';
import {useSidebar} from '../context/SidebarContext';
import {useAppDispatch, useAppSelector} from '../redux/store';
import {fetchAppointments, updateParams} from '../redux/slices/appointmentsSlice';
import {Appointment as AppointmentType} from '../api/appointmentService';
import {format, parseISO} from 'date-fns';

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
}

const AppointmentScreen = ({navigation}: AppointmentScreenProps) => {
  const {isSidebarOpen} = useSidebar();
  const dispatch = useAppDispatch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Get appointments state from Redux
  const {appointments = [], loading = false, error = null, total: totalAppointments = 0, currentParams} = 
    useAppSelector(state => state.appointments || {});

  // Default page size if currentParams is undefined
  const pageSize = currentParams?.limit || 30;

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
        date: format(appointmentDate, 'dd/MM/yyyy'),
        time: format(appointmentDate, 'hh:mm a'),
        type: appointment.appointment_type === 'adhoc' ? 'Adhoc' : 'ECW',
        status: appointment.appointment_status
      };
    });
  };

  // Load appointments when component mounts
  useEffect(() => {
    dispatch(fetchAppointments());
  }, [dispatch]);

  // Filter appointments by search query and date
  const displayAppointments = mapAppointmentsForDisplay(appointments);
  
  const filteredAppointments = displayAppointments.filter(appointment => {
    if (
      searchQuery &&
      !appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    if (dateFilter && appointment.date !== dateFilter) {
      return false;
    }

    return true;
  });

  const renderAppointmentItem = ({item}: {item: AppointmentDisplay}) => (
    <View style={styles.appointmentRow}>
      <Text style={styles.patientNameCell}>{item.patientName}</Text>
      <Text style={styles.dateCell}>{item.date}</Text>
      <Text style={styles.timeCell}>{item.time}</Text>
      <View style={styles.typeCell}>
        <View
          style={[
            styles.typeTag,
            item.type === 'ECW' ? styles.ecwTag : styles.adhocTag,
          ]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={styles.headerCell}>Patient Name</Text>
      <Text style={styles.headerCell}>Date</Text>
      <Text style={styles.headerCell}>Time</Text>
      <Text style={styles.headerCell}>Type of</Text>
    </View>
  );
  
  // Update date filter to today
  const handleSelectToday = () => {
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');
    
    dispatch(updateParams({
      appointment_date_start: formattedDate,
      appointment_date_end: formattedDate
    }));
    dispatch(fetchAppointments());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Sidebar
        isVisible={isSidebarOpen}
        onClose={() => {}}
        userInfo={{
          name: 'George Milton',
          role: 'Doctor',
        }}
      />
      
      <View style={styles.mainContent}>
        <View style={styles.contentWrapper}>
          <Text style={styles.headingText}>Appointments</Text>

          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Image
                source={require('../assets/Search.png')}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>
            
            <TouchableOpacity style={styles.filterButton}>
              <Image
                source={require('../assets/filter.png')}
                style={styles.filterIcon}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={handleSelectToday}>
              <Text style={styles.dateText}>Today</Text>
              <Text style={styles.downArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.countText}>Count: {totalAppointments}</Text>
            <Text style={styles.pageSizeText}>Page Size: {pageSize}</Text>
          </View>
          
          <View style={styles.tableContainer}>
            {renderHeader()}
            
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
                renderItem={renderAppointmentItem}
                keyExtractor={item => item.id}
                style={styles.appointmentList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No appointments found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentWrapper: {
    flex: 1,
    paddingVertical: 20,
  },
  headingText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: Colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
  filterButton: {
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterIcon: {
    width: 20,
    height: 20,
  },
  dateSelector: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dateText: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginRight: 5,
  },
  downArrow: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  countText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pageSizeText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
  },
  headerCell: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  appointmentRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  appointmentList: {
    flex: 1,
  },
  patientNameCell: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dateCell: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeCell: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  typeCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ecwTag: {
    backgroundColor: Colors.lightGreen,
  },
  adhocTag: {
    backgroundColor: '#FFF3CD', // Light yellow for Adhoc tags
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
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
