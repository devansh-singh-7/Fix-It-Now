/**
 * India States and Areas Data
 * 
 * Contains all 28 states and 8 union territories of India
 * with major cities/areas for each location.
 */

export interface StateData {
  name: string;
  code: string;
  areas: string[];
}

/**
 * All Indian states and union territories with their major areas/cities
 */
export const INDIA_LOCATIONS: StateData[] = [
  // States
  {
    name: "Andhra Pradesh",
    code: "AP",
    areas: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Kakinada", "Kadapa", "Anantapur"]
  },
  {
    name: "Arunachal Pradesh",
    code: "AR",
    areas: ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Along", "Tezu", "Roing", "Khonsa"]
  },
  {
    name: "Assam",
    code: "AS",
    areas: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Sivasagar"]
  },
  {
    name: "Bihar",
    code: "BR",
    areas: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Bihar Sharif", "Begusarai", "Katihar"]
  },
  {
    name: "Chhattisgarh",
    code: "CT",
    areas: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Mahasamund"]
  },
  {
    name: "Goa",
    code: "GA",
    areas: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Quepem"]
  },
  {
    name: "Gujarat",
    code: "GJ",
    areas: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Nadiad"]
  },
  {
    name: "Haryana",
    code: "HR",
    areas: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"]
  },
  {
    name: "Himachal Pradesh",
    code: "HP",
    areas: ["Shimla", "Dharamsala", "Manali", "Mandi", "Solan", "Nahan", "Bilaspur", "Hamirpur", "Una", "Kullu"]
  },
  {
    name: "Jharkhand",
    code: "JH",
    areas: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Dumka", "Chaibasa"]
  },
  {
    name: "Karnataka",
    code: "KA",
    areas: ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belgaum", "Davanagere", "Gulbarga", "Shimoga", "Tumkur", "Bellary"]
  },
  {
    name: "Kerala",
    code: "KL",
    areas: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Palakkad", "Alappuzha", "Kottayam", "Malappuram"]
  },
  {
    name: "Madhya Pradesh",
    code: "MP",
    areas: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"]
  },
  {
    name: "Maharashtra",
    code: "MH",
    areas: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Navi Mumbai", "Kolhapur", "Amravati"]
  },
  {
    name: "Manipur",
    code: "MN",
    areas: ["Imphal", "Thoubal", "Kakching", "Ukhrul", "Churachandpur", "Bishnupur", "Senapati", "Chandel", "Tamenglong", "Jiribam"]
  },
  {
    name: "Meghalaya",
    code: "ML",
    areas: ["Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar", "Baghmara", "Resubelpara", "Ampati", "Nongpoh", "Mairang"]
  },
  {
    name: "Mizoram",
    code: "MZ",
    areas: ["Aizawl", "Lunglei", "Serchhip", "Champhai", "Kolasib", "Saiha", "Lawngtlai", "Mamit", "Khawzawl", "Saitual"]
  },
  {
    name: "Nagaland",
    code: "NL",
    areas: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Longleng", "Kiphire"]
  },
  {
    name: "Odisha",
    code: "OR",
    areas: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"]
  },
  {
    name: "Punjab",
    code: "PB",
    areas: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Batala"]
  },
  {
    name: "Rajasthan",
    code: "RJ",
    areas: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Bharatpur", "Sikar"]
  },
  {
    name: "Sikkim",
    code: "SK",
    areas: ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Rangpo", "Jorethang", "Singtam", "Ravangla", "Pelling", "Lachung"]
  },
  {
    name: "Tamil Nadu",
    code: "TN",
    areas: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Erode", "Vellore", "Thoothukudi"]
  },
  {
    name: "Telangana",
    code: "TS",
    areas: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Siddipet"]
  },
  {
    name: "Tripura",
    code: "TR",
    areas: ["Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia", "Khowai", "Teliamura", "Ambassa", "Sabroom", "Sonamura"]
  },
  {
    name: "Uttar Pradesh",
    code: "UP",
    areas: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Ghaziabad", "Meerut", "Prayagraj", "Noida", "Bareilly", "Aligarh"]
  },
  {
    name: "Uttarakhand",
    code: "UK",
    areas: ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Roorkee", "Kashipur", "Rudrapur", "Nainital", "Mussoorie", "Almora"]
  },
  {
    name: "West Bengal",
    code: "WB",
    areas: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Kharagpur", "Haldia", "Darjeeling"]
  },
  // Union Territories
  {
    name: "Andaman and Nicobar Islands",
    code: "AN",
    areas: ["Port Blair", "Diglipur", "Rangat", "Mayabunder", "Car Nicobar", "Havelock Island", "Neil Island", "Bamboo Flat", "Garacharma", "Prothrapur"]
  },
  {
    name: "Chandigarh",
    code: "CH",
    areas: ["Sector 17", "Sector 22", "Sector 35", "Sector 43", "Industrial Area", "Manimajra", "IT Park", "Sector 8"]
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DN",
    areas: ["Daman", "Diu", "Silvassa", "Amli", "Naroli", "Kachigam", "Bhimpore", "Vapi Border"]
  },
  {
    name: "Delhi",
    code: "DL",
    areas: ["New Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi", "Central Delhi", "Noida Border", "Gurgaon Border", "Dwarka", "Rohini"]
  },
  {
    name: "Jammu and Kashmir",
    code: "JK",
    areas: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kupwara", "Pulwama", "Rajouri", "Kathua", "Udhampur", "Doda"]
  },
  {
    name: "Ladakh",
    code: "LA",
    areas: ["Leh", "Kargil", "Nubra", "Zanskar", "Drass", "Turtuk", "Hanle", "Pangong", "Diskit"]
  },
  {
    name: "Lakshadweep",
    code: "LD",
    areas: ["Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott", "Kalpeni", "Kadmat", "Kiltan", "Chetlat", "Bitra"]
  },
  {
    name: "Puducherry",
    code: "PY",
    areas: ["Puducherry", "Karaikal", "Mahe", "Yanam", "Ozhukarai", "Villianur", "Bahour", "Ariyankuppam"]
  }
];

/**
 * Get all state names
 */
export function getStateNames(): string[] {
  return INDIA_LOCATIONS.map(location => location.name);
}

/**
 * Get areas for a specific state
 */
export function getAreasForState(stateName: string): string[] {
  const state = INDIA_LOCATIONS.find(
    location => location.name.toLowerCase() === stateName.toLowerCase()
  );
  return state?.areas || [];
}

/**
 * Get state by name
 */
export function getStateByName(stateName: string): StateData | undefined {
  return INDIA_LOCATIONS.find(
    location => location.name.toLowerCase() === stateName.toLowerCase()
  );
}

/**
 * Get state by code
 */
export function getStateByCode(stateCode: string): StateData | undefined {
  return INDIA_LOCATIONS.find(
    location => location.code.toUpperCase() === stateCode.toUpperCase()
  );
}
