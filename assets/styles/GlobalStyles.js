import { StyleSheet } from "react-native";

const GlobalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  
  // Text styles
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 30,
    textAlign: "center",
  },
  
  // Form styles
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    width: "100%",
  },
  
  // Button styles
  buttonContainer: {
    width: "100%",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 8,
    width: "100%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  primaryButton: {
    backgroundColor: "#000000",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  
  // Profile & form styles
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  infoContainer: {
    width: '90%',
    marginTop: 20,
  },
  row: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: '#000',
  },
  
  // Other utility styles
  loader: {
    marginVertical: 20,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  navButtonText: {
    fontSize: 16,
    color: "#000000",
  },
  
  // Feeder-related styles
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    marginVertical: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  feederInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  linkButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  feederCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  feederHeader: {
    marginBottom: 10,
  },
  feederTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  feederSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  feederContent: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  feederLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 5,
  },
  feederValue: {
    fontSize: 15,
    color: '#444',
  },
  configureButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  configureButtonText: {
    color: '#000',
    fontWeight: '500',
  },
  noFeedersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noFeedersText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  noFeedersSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  feederList: {
    width: '100%',
    marginTop: 10,
  },
  feederItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  feederDetail: {
    fontSize: 14,
    color: '#444',
    marginBottom: 3,
  },
  feedersScrollContainer: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRadius: 8,
    padding: 5,
  },
  
  // Scheduler-specific styles
  schedulerScrollView: {
    flex: 1,
    padding: 16,
  },
  schedulerHeaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feedNowContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  feedNowButton: {
    width: '80%',
  },
  feedingTimesContainer: {
    marginBottom: 25,
  },
  feedingTimesButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  feedingTimeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  feedingTimeButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  feedingTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  feedingTimeTextSelected: {
    color: '#fff',
  },
  scheduleContainer: {
    marginBottom: 30,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeHeaderCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 4,
    marginLeft: 1,
    minWidth: 30,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeSlotsContainer: {
    maxHeight: 400,
  },
  timeSlotRow: {
    flexDirection: 'row',
    marginBottom: 1,
    height: 40,
  },
  timeCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  timeText: {
    fontSize: 10,
  },
  scheduleCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    marginLeft: 1,
  },
  selectedCell: {
    backgroundColor: '#e0f7e0',
  },
  checkmark: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#eaeaea",
  },
  navbarLogo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
  },
  navLinkContainer: {
    marginLeft: 10,
  },
  // Note: You already have navButton and navButtonText styles in GlobalStyles
  navSignUpButton: {
    backgroundColor: "#000000",
  },
  navSignUpText: {
    color: "#ffffff",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});

export default GlobalStyles;