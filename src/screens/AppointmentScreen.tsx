import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../theme/Colors';
import {RootStackParamList} from '../navigation/AppNavigator';
import Sidebar from '../components/Sidebar';
import {useSidebar} from '../context/SidebarContext';

type AppointmentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
};

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  type: 'ECW' | 'Adhoc';
}

const AppointmentScreen = ({navigation}: AppointmentScreenProps) => {
  const {isSidebarOpen} = useSidebar();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('24/05/2024');

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      patientName: 'John Doe',
      date: '24/05/2024',
      time: '11:00 AM',
      type: 'ECW',
    },
    {
      id: '2',
      patientName: 'John Smith',
      date: '24/05/2024',
      time: '11:00 AM',
      type: 'Adhoc',
    },
    {
      id: '3',
      patientName: 'Michael Brown',
      date: '24/05/2024',
      time: '11:00 AM',
      type: 'ECW',
    },
    {
      id: '4',
      patientName: 'Emily White',
      date: '24/05/2024',
      time: '11:00 AM',
      type: 'ECW',
    },
    {
      id: '5',
      patientName: 'John Doe',
      date: '24/05/2024',
      time: '11:00 AM',
      type: 'Adhoc',
    },
  ]);

  const totalAppointments = 9467;
  const pageSize = 5;

  const filteredAppointments = appointments.filter(appointment => {
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

  const renderAppointmentItem = ({item}: {item: Appointment}) => (
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
            
            <TouchableOpacity style={styles.dateSelector}>
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
            <FlatList
              data={filteredAppointments}
              renderItem={renderAppointmentItem}
              keyExtractor={item => item.id}
              style={styles.appointmentList}
            />
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
    paddingVertical: 15,
  },
  contentWrapper: {
    flex: 1,
  },
  headingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 15,
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
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  searchIcon: {
    width: 16,
    height: 16,
    tintColor: '#999',
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  filterButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  filterIcon: {
    width: 16,
    height: 16,
    tintColor: '#999',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  }
});

export default AppointmentScreen;
