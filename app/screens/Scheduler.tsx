import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import supabase from '../_utils/lib/supabase';

// Day names for the week - both full and short versions
const DAYS_OF_WEEK = [
  { full: 'Mon', short: 'M' },
  { full: 'Tue', short: 'T' },
  { full: 'Wed', short: 'W' },
  { full: 'Thu', short: 'T' },
  { full: 'Fri', short: 'F' },
  { full: 'Sat', short: 'S' },
  { full: 'Sun', short: 'S' }
];

// This will be used to set feeding times per day
const DEFAULT_FEEDING_TIMES = 2;

const Scheduler = (): JSX.Element => {
  const { feederId, feederName } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  // Check screen width once for small screen detection
  const screenWidth = Dimensions.get('window').width;
  const useShortDayNames = screenWidth < 350;
  
  // State for managing feeding schedule
  const [feedingTimes, setFeedingTimes] = useState(DEFAULT_FEEDING_TIMES);
  
  // Initialize schedule state with empty arrays for each day
  const [schedule, setSchedule] = useState<{[day: string]: string[]}>({
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: []
  });
  
  // Time slots available for selection (24-hour format)
  const timeSlots = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  // Fetch existing schedule data when component mounts
  useEffect(() => {
    fetchSchedule();
  }, [feederId]);

  // Function to fetch existing schedule
  const fetchSchedule = async () => {
    if (!feederId) return;
    
    try {
      setInitializing(true);
      
      // Query the schedule table for this feeder
      const { data, error } = await supabase
        .from('schedule')
        .select('scheduleid, schedule_data')
        .eq('FeederID', feederId)
        .maybeSingle(); // Use maybeSingle since there might be no schedule yet
      
      if (error) throw error;
      
      if (data) {
        // We found an existing schedule
        setScheduleId(data.scheduleid);
        
        // Since we're using JSONB, data.schedule_data should already be parsed
        const scheduleData = data.schedule_data;
        
        if (scheduleData && scheduleData.schedule) {
          setSchedule(scheduleData.schedule);
          
          // If the saved data includes feedingTimes, set that too
          if (scheduleData.feedingTimes) {
            setFeedingTimes(scheduleData.feedingTimes);
          }
        }
      }
      // If no data, create a new schedule when saving
      
    } catch (error) {
      console.error("Error fetching schedule:", error);
      Alert.alert("Error", "Failed to load the feeding schedule");
    } finally {
      setInitializing(false);
    }
  };
  
  // Function to toggle a time slot for a specific day
  const toggleTimeSlot = (day: string, time: string) => {
    setSchedule(prevSchedule => {
      const updatedDaySchedule = [...prevSchedule[day]];
      
      // If the time is already scheduled, remove it
      if (updatedDaySchedule.includes(time)) {
        return {
          ...prevSchedule,
          [day]: updatedDaySchedule.filter(t => t !== time)
        };
      } 
      
      // If adding a new time but we've reached the limit, alert the user
      if (updatedDaySchedule.length >= feedingTimes) {
        Alert.alert(
          "Maximum Times Reached",
          `You can only set ${feedingTimes} feeding times per day.`
        );
        return prevSchedule;
      }
      
      // Otherwise add the new time
      return {
        ...prevSchedule,
        [day]: [...updatedDaySchedule, time].sort()
      };
    });
  };

  // Handle saving the schedule
  const saveSchedule = async () => {
    if (!feederId) {
      Alert.alert("Error", "No feeder ID provided");
      return;
    }
    
    setLoading(true);
    try {
      // Prepare the schedule data as a JSON object
      const scheduleData = {
        feedingTimes,
        schedule,
        lastUpdated: new Date().toISOString()
      };
      
      if (scheduleId) {
        // Update existing schedule - with JSONB we don't need to stringify
        const { error } = await supabase
          .from('schedule')
          .update({ 
            schedule_data: scheduleData 
          })
          .eq('scheduleid', scheduleId);
          
        if (error) throw error;
      } else {
        // Create new schedule - with JSONB we don't need to stringify
        const { data, error } = await supabase
          .from('schedule')
          .insert({ 
            FeederID: feederId,
            schedule_data: scheduleData,
            quantity: 0 // Default value, will be updated later
          })
          .select('scheduleid')
          .single();
          
        if (error) throw error;
        
        // Store the new schedule ID
        if (data) {
          setScheduleId(data.scheduleid);
        }
      }
      
      Alert.alert(
        "Schedule Saved",
        "Your feeding schedule has been saved successfully.",
        [
          { text: "OK", onPress: () => router.back() }
        ]
      );
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      Alert.alert("Error", `Failed to save schedule: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle the "Feed Now" action
  const handleFeedNow = () => {
    Alert.alert(
      "Confirm Feeding",
      "Are you sure you want to feed now?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Feed", 
          onPress: async () => {
            setLoading(true);
            try {
              
              // FEED NOW FUNCTION
              console.log("Feed now triggered for feeder:", feederId);
              
              // simulate an API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              Alert.alert("Success", "Feeding initiated!");
            } catch (error: any) {
              Alert.alert("Error", `Failed to initiate feeding: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Check if a time slot is selected for a specific day
  const isTimeSelected = (day: string, time: string): boolean => {
    return schedule[day].includes(time);
  };

  if (loading || initializing) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <LoadingIndicator />
      </View>
    );
  }

  const goBack = () => {
    router.back();
  };

  return (
    <View style={GlobalStyles.container}>
      {/* Back button outside the ScrollView */}
      <TouchableOpacity 
        style={[GlobalStyles.backButton, { margin: 16 }]} 
        onPress={goBack}
      >
        <Text style={GlobalStyles.backButtonText}>← Back</Text>
      </TouchableOpacity>
  
      <ScrollView style={GlobalStyles.schedulerScrollView}>
        <View style={GlobalStyles.schedulerHeaderContainer}>
          <Text style={GlobalStyles.title}>
            {feederName ? `Configure ${feederName}` : 'Feeder Schedule'}
          </Text>
          <Text style={GlobalStyles.subtitle}>
            Feeder ID: {feederId}
          </Text>
        </View>
  
        {/* Feed Now Button */}
        <View style={GlobalStyles.feedNowContainer}>
          <Button
            title="Feed Now"
            variant="primary"
            onPress={handleFeedNow}
            style={GlobalStyles.feedNowButton}
          />
        </View>

        {/* Feeding Times Selector */}
        <View style={GlobalStyles.feedingTimesContainer}>
          <Text style={GlobalStyles.sectionTitle}>Feedings Per Day:</Text>
          <View style={GlobalStyles.feedingTimesButtons}>
            {[1, 2, 3, 4].map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  GlobalStyles.feedingTimeButton,
                  feedingTimes === num && GlobalStyles.feedingTimeButtonSelected
                ]}
                onPress={() => setFeedingTimes(num)}
              >
                <Text style={[
                  GlobalStyles.feedingTimeText,
                  feedingTimes === num && GlobalStyles.feedingTimeTextSelected
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Schedule Grid */}
        <View style={GlobalStyles.scheduleContainer}>
          <Text style={GlobalStyles.sectionTitle}>Weekly Schedule</Text>
          
          {/* Days header row */}
          <View style={GlobalStyles.daysHeaderRow}>
            <View style={GlobalStyles.timeHeaderCell}>
              <Text style={GlobalStyles.headerText}>Time</Text>
            </View>
            {DAYS_OF_WEEK.map(day => (
              <View key={day.full} style={GlobalStyles.dayHeaderCell}>
                <Text style={GlobalStyles.headerText}>
                  {useShortDayNames ? day.short : day.full}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Time slots grid */}
          <ScrollView nestedScrollEnabled={true} style={GlobalStyles.timeSlotsContainer}>
            {timeSlots.map(time => (
              <View key={time} style={GlobalStyles.timeSlotRow}>
                <View style={GlobalStyles.timeCell}>
                  <Text style={GlobalStyles.timeText}>{time}</Text>
                </View>
                {DAYS_OF_WEEK.map(day => (
                  <TouchableOpacity
                    key={`${day.full}-${time}`}
                    style={[
                      GlobalStyles.scheduleCell,
                      isTimeSelected(day.full, time) && GlobalStyles.selectedCell
                    ]}
                    onPress={() => toggleTimeSlot(day.full, time)}
                  >
                    {isTimeSelected(day.full, time) && (
                      <Text style={GlobalStyles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Save Button */}
        <View style={GlobalStyles.saveButtonContainer}>
          <Button 
            title="Save Schedule" 
            variant="primary" 
            onPress={saveSchedule} 
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default Scheduler;