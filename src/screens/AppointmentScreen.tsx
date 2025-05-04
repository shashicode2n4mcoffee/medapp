import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';

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

const AppointmentScreen = ({ navigation }: AppointmentScreenProps) => {
  // Always use light mode for this screen
  const isDarkMode = false;
  
  // Use the sidebar context
  const { isSidebarOpen } = useSidebar();
  
  // State for filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('24/05/2024');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  // Mock data for appointments
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', patientName: 'John Doe', date: '24/05/2024', time: '11:00 AM', type: 'ECW' },
    { id: '2', patientName: 'John Smith', date: '24/05/2024', time: '11:00 AM', type: 'Adhoc' },
    { id: '3', patientName: 'Michael Brown', date: '24/05/2024', time: '11:00 AM', type: 'ECW' },
    { id: '4', patientName: 'Emily White', date: '24/05/2024', time: '11:00 AM', type: 'ECW' },
    { id: '5', patientName: 'John Doe', date: '24/05/2024', time: '11:00 AM', type: 'Adhoc' },
  ]);
  
  // Current page and total pages for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Based on the UI design
  const totalPages = 15; // For example purposes as shown in the UI
  const totalAppointments = 8487; // From the UI count
  
  // Filter appointments based on search query and other filters
  const filteredAppointments = appointments.filter(appointment => {
    // Apply search filter
    if (searchQuery && !appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply date filter if needed
    if (dateFilter && appointment.date !== dateFilter) {
      return false;
    }
    
    // Apply type filter
    if (selectedFilter && appointment.type !== selectedFilter) {
      return false;
    }
    
    return true;
  });
  
  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentRow}>
      <Text style={styles.patientNameCell}>{item.patientName}</Text>
      <Text style={styles.dateCell}>{item.date}</Text>
      <Text style={styles.timeCell}>{item.time}</Text>
      <View style={styles.typeCell}>
        <View style={[
          styles.typeTag,
          item.type === 'ECW' ? styles.ecwTag : styles.adhocTag
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

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity 
        style={styles.paginationArrow} 
        onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Text style={styles.paginationArrowText}>‹</Text>
      </TouchableOpacity>
      
      {/* First page */}
      <TouchableOpacity 
        style={[
          styles.paginationButton,
          currentPage === 1 && styles.paginationButtonActive
        ]}
        onPress={() => setCurrentPage(1)}
      >
        <Text 
          style={[
            styles.paginationButtonText,
            currentPage === 1 && styles.paginationButtonTextActive
          ]}
        >
          1
        </Text>
      </TouchableOpacity>
      
      {/* Second page */}
      <TouchableOpacity 
        style={[
          styles.paginationButton,
          currentPage === 2 && styles.paginationButtonActive
        ]}
        onPress={() => setCurrentPage(2)}
      >
        <Text 
          style={[
            styles.paginationButtonText,
            currentPage === 2 && styles.paginationButtonTextActive
          ]}
        >
          2
        </Text>
      </TouchableOpacity>
      
      {/* Third page */}
      <TouchableOpacity 
        style={[
          styles.paginationButton,
          currentPage === 3 && styles.paginationButtonActive
        ]}
        onPress={() => setCurrentPage(3)}
      >
        <Text 
          style={[
            styles.paginationButtonText,
            currentPage === 3 && styles.paginationButtonTextActive
          ]}
        >
          3
        </Text>
      </TouchableOpacity>
      
      {/* Ellipsis */}
      <Text style={styles.paginationEllipsis}>...</Text>
      
      {/* Last Page */}
      <TouchableOpacity 
        style={[
          styles.paginationButton,
          currentPage === totalPages && styles.paginationButtonActive
        ]}
        onPress={() => setCurrentPage(totalPages)}
      >
        <Text 
          style={[
            styles.paginationButtonText,
            currentPage === totalPages && styles.paginationButtonTextActive
          ]}
        >
          {totalPages}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.paginationArrow}
        onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.paginationArrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: Colors.light }]}
      edges={['bottom', 'left', 'right']}
    >
      {/* Sidebar Component */}
      <Sidebar 
        isVisible={isSidebarOpen}
        onClose={() => {}}
        userInfo={{
          name: 'George Milton',
          role: 'Doctor',
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>
      
      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
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
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterIcon}>≡</Text>
        </TouchableOpacity>
      </View>
      
      {/* Date and Type Filter */}
      <View style={styles.filterOptionsContainer}>
        <TouchableOpacity style={styles.dateSelectorContainer}>
          <Text style={styles.dateText}>Today</Text>
          <Text style={styles.downArrowIcon}>▼</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.countContainer}>
        <Text style={styles.countText}>Count: {totalAppointments}</Text>
        <Text style={styles.pageInfo}>Page Size: {itemsPerPage}</Text>
      </View>
      
      <View style={styles.tableContainer}>
        {renderHeader()}
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          style={styles.appointmentList}
        />
      </View>
      
      {renderPagination()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingLeft: 6,
  },
  searchIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.textTertiary,
  },
  filterButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 5,
  },
  downArrowIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pageInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  appointmentRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  appointmentList: {
    flexGrow: 0,
  },
  patientNameCell: {
    flex: 1,
    fontSize: 14,
  },
  dateCell: {
    flex: 1,
    fontSize: 14,
  },
  timeCell: {
    flex: 1,
    fontSize: 14,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  paginationButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'white',
  },
  paginationButtonActive: {
    backgroundColor: Colors.primary,
  },
  paginationButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paginationButtonTextActive: {
    color: 'white',
  },
  paginationArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'white',
  },
  paginationEllipsis: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: 4,
  },
  paginationArrowText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
});

export default AppointmentScreen;