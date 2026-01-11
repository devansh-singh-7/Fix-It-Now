# Admin Analytics Module

Comprehensive analytics dashboard for building administrators with real-time insights, predictive AI, and performance metrics.

## 📊 Features

### 1. **Building Health Score**
- Overall health metric (0-100 scale)
- Calculated from:
  - Ticket completion rate (40%)
  - Open ticket ratio (30%)
  - High-risk AI predictions (30%)
- Visual circular progress indicator
- Color-coded: Green (≥80), Yellow (60-79), Red (<60)

### 2. **Ticket Analytics**
- **Status Distribution**: Open, Assigned, Accepted, In Progress, Completed
- **Category Breakdown**: Plumbing, Electrical, HVAC, Cleaning, Other
- **Priority Analysis**: Low, Medium, High, Urgent
- **30-Day Trend**: Line chart showing ticket creation over time
- **Key Metrics**:
  - Total tickets
  - Open tickets count
  - Completed tickets count
  - Average completion time (hours)

### 3. **Technician Performance**
- **Per-Technician Metrics**:
  - Total assigned tickets
  - Completed tickets
  - In-progress tickets
  - Completion rate (percentage)
  - Average completion time
  - Tickets by category
- **Visual Charts**:
  - Stacked bar chart (completed vs in-progress)
  - Detailed performance table
- **Performance Comparison**: Side-by-side technician rankings

### 4. **AI Predictions Summary**
- **Risk Distribution**: Low, Medium, High
- **Model Statistics**: RandomForest, LogisticRegression
  - Prediction count per model
  - Average failure probability
- **Recent High-Risk Alerts**: Top 5 latest predictions
- **Recommended Actions**: Preventive maintenance suggestions

### 5. **Revenue Analytics**
- **Financial Overview**:
  - Total revenue
  - Paid amount
  - Pending amount
  - Cancelled amount
  - Average invoice amount
- **Monthly Trend**: 12-month revenue chart
- **Payment Status**: Visual breakdown by invoice status

---

## 🎯 API Endpoints

### Overview
```http
GET /api/analytics/overview?buildingId={buildingId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "buildingId": "string",
    "healthScore": 85,
    "tickets": { /* TicketStats */ },
    "technicians": [ /* TechnicianPerformance[] */ ],
    "predictions": { /* PredictionSummary */ },
    "invoices": { /* InvoiceAnalytics */ },
    "generatedAt": "2025-12-06T10:30:00Z"
  }
}
```

### Ticket Statistics
```http
GET /api/analytics/tickets?buildingId={buildingId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "open": 20,
    "assigned": 15,
    "accepted": 10,
    "inProgress": 25,
    "completed": 80,
    "byCategory": [
      { "category": "plumbing", "count": 45 },
      { "category": "electrical", "count": 30 }
    ],
    "byPriority": [
      { "priority": "high", "count": 20 },
      { "priority": "medium", "count": 50 }
    ],
    "avgCompletionTime": 18.5,
    "trend": [
      { "date": "2025-11-07", "count": 5 },
      { "date": "2025-11-08", "count": 8 }
    ]
  }
}
```

### Technician Performance
```http
GET /api/analytics/technicians?buildingId={buildingId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uid": "tech123",
      "name": "John Doe",
      "totalAssigned": 45,
      "completed": 38,
      "inProgress": 7,
      "avgCompletionTime": 16.2,
      "completionRate": 84.4,
      "ticketsByCategory": [
        { "category": "plumbing", "count": 20 },
        { "category": "electrical", "count": 15 }
      ]
    }
  ]
}
```

### AI Predictions
```http
GET /api/analytics/predictions?buildingId={buildingId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "highRisk": 15,
    "mediumRisk": 35,
    "lowRisk": 50,
    "byModel": [
      {
        "model": "RandomForest",
        "count": 60,
        "avgProbability": 0.65
      }
    ],
    "recentPredictions": [
      {
        "id": "pred123",
        "ticketId": "ticket456",
        "riskBucket": "high",
        "failureProbability": 0.89,
        "recommendedAction": "Schedule preventive check in 3 days",
        "createdAt": "2025-12-06T09:00:00Z"
      }
    ]
  }
}
```

---

## 🔧 MongoDB Aggregations

### Ticket Status Aggregation
```javascript
db.tickets.aggregate([
  { $match: { buildingId: "building123" } },
  { 
    $group: { 
      _id: '$status', 
      count: { $sum: 1 } 
    } 
  }
])
```

### Technician Performance Aggregation
```javascript
db.tickets.aggregate([
  { 
    $match: { 
      buildingId: "building123",
      assignedTo: { $exists: true, $ne: null }
    } 
  },
  {
    $group: {
      _id: '$assignedTo',
      techName: { $first: '$assignedToName' },
      totalAssigned: { $sum: 1 },
      completed: {
        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
      },
      inProgress: {
        $sum: { 
          $cond: [
            { $in: ['$status', ['assigned', 'accepted', 'in_progress']] }, 
            1, 
            0
          ] 
        }
      }
    }
  },
  { $sort: { completed: -1 } }
])
```

### Average Completion Time
```javascript
db.tickets.aggregate([
  { 
    $match: { 
      buildingId: "building123", 
      status: "completed",
      completedAt: { $exists: true }
    } 
  },
  {
    $project: {
      completionTime: {
        $divide: [
          { $subtract: ['$completedAt', '$createdAt'] },
          3600000 // Convert to hours
        ]
      }
    }
  },
  {
    $group: {
      _id: null,
      avgTime: { $avg: '$completionTime' }
    }
  }
])
```

### 30-Day Trend
```javascript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

db.tickets.aggregate([
  { 
    $match: { 
      buildingId: "building123",
      createdAt: { $gte: thirtyDaysAgo }
    } 
  },
  {
    $group: {
      _id: { 
        $dateToString: { 
          format: '%Y-%m-%d', 
          date: '$createdAt' 
        } 
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
])
```

---

## 📈 Chart Components

### Chart.js Integration
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
```

### Available Chart Types

1. **Bar Chart** - Ticket status distribution
2. **Doughnut Chart** - Category distribution
3. **Pie Chart** - Priority distribution
4. **Line Chart** - 30-day trend
5. **Stacked Bar Chart** - Technician performance
6. **Area Chart** - Revenue trends

---

## 🎨 UI Components

### Health Score Indicator
```tsx
<svg className="w-full h-full" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
  <circle
    cx="50"
    cy="50"
    r="40"
    fill="none"
    stroke={getHealthScoreColor(score)}
    strokeWidth="8"
    strokeDasharray={`${score * 2.51} 251`}
    strokeLinecap="round"
    transform="rotate(-90 50 50)"
  />
</svg>
```

### Metric Cards
- Total Tickets: 🎫 icon, gray color
- Open Tickets: 📝 icon, blue color
- Completed Tickets: ✅ icon, green color
- Avg Completion: ⏱️ icon, purple color

### Performance Table
- Sortable columns
- Responsive design
- Color-coded completion rates
- Hover effects

---

## 🔐 Access Control

### Role-Based Access
- **Admin Only**: Full access to analytics dashboard
- **Automatic Redirect**: Non-admins redirected to dashboard
- **Building Scope**: Data filtered by admin's building

### Authentication Check
```typescript
const profile = await getUserProfile(user.uid);
if (profile.role !== 'admin') {
  router.push('/dashboard');
  return;
}
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Single column layout
- **Tablet**: 2-column grid for charts
- **Desktop**: Full 4-column grid for metrics

### Chart Responsiveness
```typescript
options={{ 
  responsive: true, 
  maintainAspectRatio: true 
}}
```

---

## 🚀 Usage

### Navigate to Analytics
1. Sign in as **Admin**
2. Click **Analytics** in navigation bar
3. Dashboard loads automatically with building data

### Refresh Data
- Data automatically fetched on page load
- Real-time updates via MongoDB queries
- No manual refresh needed

### Export Data (Future Enhancement)
- PDF export functionality
- CSV download for reports
- Email scheduled reports

---

## 🧪 Testing

### Test Analytics Endpoint
```bash
curl "http://localhost:3000/api/analytics/overview?buildingId=building123"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "healthScore": 85,
    "tickets": { "total": 150, ... },
    "technicians": [...],
    "predictions": {...},
    "invoices": {...}
  }
}
```

---

## 🔮 Future Enhancements

1. **Real-time Updates**
   - WebSocket integration
   - Live chart updates
   - Push notifications for critical metrics

2. **Advanced Filters**
   - Date range selector
   - Custom date ranges
   - Technician-specific filters

3. **Custom Reports**
   - Report builder UI
   - Scheduled email reports
   - PDF generation

4. **Comparative Analytics**
   - Multi-building comparison
   - Historical comparisons
   - Benchmark against industry standards

5. **Predictive Insights**
   - Forecast ticket volumes
   - Resource allocation suggestions
   - Budget predictions

6. **Mobile App**
   - Native iOS/Android apps
   - Push notifications
   - Offline mode

---

## 📊 Performance Optimization

### MongoDB Indexes
Ensure these indexes exist for optimal performance:

```javascript
db.tickets.createIndex({ "buildingId": 1, "status": 1 });
db.tickets.createIndex({ "buildingId": 1, "createdAt": -1 });
db.tickets.createIndex({ "assignedTo": 1 });
db.predictions.createIndex({ "buildingId": 1, "prediction.riskBucket": 1 });
db.invoices.createIndex({ "buildingId": 1, "createdAt": -1 });
```

### Caching Strategy
- Implement Redis caching for frequently accessed data
- Cache TTL: 5 minutes for analytics data
- Invalidate cache on ticket updates

---

## 🐛 Troubleshooting

### No Data Showing
- Verify `buildingId` exists in user profile
- Check MongoDB connection
- Ensure collections have data

### Charts Not Rendering
- Verify Chart.js is installed: `npm install chart.js react-chartjs-2`
- Check browser console for errors
- Ensure data format matches chart requirements

### Slow Loading
- Add MongoDB indexes (see above)
- Implement data pagination
- Use caching layer

---

## 📚 Dependencies

```json
{
  "chart.js": "^4.x",
  "react-chartjs-2": "^5.x",
  "mongodb": "^6.x",
  "next": "14.x"
}
```

---

## 🎯 Key Metrics Summary

| Metric | Source | Calculation |
|--------|--------|-------------|
| Health Score | Tickets + Predictions | Weighted average (completion 40%, open ratio 30%, risk 30%) |
| Avg Completion Time | Tickets | (completedAt - createdAt) / total completed |
| Completion Rate | Technician Performance | (completed / totalAssigned) × 100 |
| Risk Distribution | Predictions | Count by riskBucket |
| Total Revenue | Invoices | Sum of all invoice amounts |

---

Built with ❤️ for FixItNow - Smart Building Management
