import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import { RootStackParamList } from '../navigation/AppNavigator';

type AppointmentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
};

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  type: 'ECW' | 'Admin';
}

const AppointmentScreen = ({ navigation }: AppointmentScreenProps) => {
  // Always use light mode for this screen
  const isDarkMode = false;
  
  // Mock data for appointments
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', patientName: 'John Doe', date: '24/05/2024', time: '11:00 AM', type: 'ECW' },
    { id: '2', patientName: 'John Smith', date: '24/05/2024', time: '11:00 AM', type: 'Admin' },
    { id: '3', patientName: 'Michael Brown', date: '24/05/2024', time: '11:00 AM', type: 'ECW' },
    { id: '4', patientName: 'Emily White', date: '24/05/2024', time: '11:00 AM', type: 'ECW' },
    { id: '5', patientName: 'John Doe', date: '24/05/2024', time: '11:00 AM', type: 'Admin' },
  ]);
  
  // Current page and total pages for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(appointments.length / 5);
  
  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentRow}>
      <Text style={styles.patientNameCell}>{item.patientName}</Text>
      <Text style={styles.dateCell}>{item.date}</Text>
      <Text style={styles.timeCell}>{item.time}</Text>
      <View style={styles.typeCell}>
        <View style={[
          styles.typeTag,
          item.type === 'ECW' ? styles.ecwTag : styles.adminTag
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
        style={[styles.paginationArrow, currentPage === 1 && styles.paginationArrowDisabled]} 
        onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Text style={styles.paginationArrowText}>‹</Text>
      </TouchableOpacity>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <TouchableOpacity 
          key={`page-${page}`}
          style={[
            styles.paginationButton,
            currentPage === page && styles.paginationButtonActive
          ]}
          onPress={() => setCurrentPage(page)}
        >
          <Text 
            style={[
              styles.paginationButtonText,
              currentPage === page && styles.paginationButtonTextActive
            ]}
          >
            {page}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity 
        style={[styles.paginationArrow, currentPage === totalPages && styles.paginationArrowDisabled]} 
        onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.paginationArrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: isDarkMode ? Colors.dark : Colors.light }]}
      edges={['bottom', 'left', 'right']}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>≡</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.countContainer}>
        <Text style={styles.countText}>Count: 8487</Text>
        <Text style={styles.pageInfo}>Page Size: 6</Text>
      </View>
      
      <View style={styles.tableContainer}>
        {renderHeader()}
        <FlatList
          data={appointments}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    marginRight: 8,
  },
  searchIcon: {
    fontSize: 20,
  },
  filterButton: {
    padding: 2,
  },
  filterIcon: {
    fontSize: 20,
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
  adminTag: {
    backgroundColor: '#FFF3CD', // Light yellow for Admin tags
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
  },
  paginationArrowDisabled: {
    opacity: 0.5,
  },
  paginationArrowText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
});

export default AppointmentScreen;