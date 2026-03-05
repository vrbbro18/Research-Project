const accidents = [
  {
    accidentId: "ACC-2024-001",
    vehicleNo: "ABC-1234",
    riskLevel: "HIGH",
    gpsLocation: {
      latitude: 6.9271,
      longitude: 79.8612,
      address: "Colombo 07, Sri Lanka"
    },
    timestamp: "2024-01-15T08:30:00.000Z"
  },
  {
    accidentId: "ACC-2024-002",
    vehicleNo: "XYZ-5678",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9344,
      longitude: 79.8428,
      address: "Colombo 05, Sri Lanka"
    },
    timestamp: "2024-01-16T14:22:15.000Z"
  },
  {
    accidentId: "ACC-2024-003",
    vehicleNo: "DEF-9012",
    riskLevel: "LOW",
    gpsLocation: {
      latitude: 6.9204,
      longitude: 79.8536,
      address: "Colombo 03, Sri Lanka"
    },
    timestamp: "2024-01-17T09:15:30.000Z"
  },
  {
    accidentId: "ACC-2024-004",
    vehicleNo: "GHI-3456",
    riskLevel: "HIGH",
    gpsLocation: {
      latitude: 6.9176,
      longitude: 79.8479,
      address: "Colombo 04, Sri Lanka"
    },
    timestamp: "2024-01-18T16:45:00.000Z"
  },
  {
    accidentId: "ACC-2024-005",
    vehicleNo: "JKL-7890",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9319,
      longitude: 79.8577,
      address: "Colombo 06, Sri Lanka"
    },
    timestamp: "2024-01-19T11:30:45.000Z"
  },
  {
    accidentId: "ACC-2024-006",
    vehicleNo: "ABC-1234",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9048,
      longitude: 79.8521,
      address: "Colombo 02, Sri Lanka"
    },
    timestamp: "2024-01-20T13:20:10.000Z"
  },
  {
    accidentId: "ACC-2024-007",
    vehicleNo: "MNO-2468",
    riskLevel: "LOW",
    gpsLocation: {
      latitude: 6.9431,
      longitude: 79.8654,
      address: "Colombo 08, Sri Lanka"
    },
    timestamp: "2024-01-21T07:55:20.000Z"
  },
  {
    accidentId: "ACC-2024-008",
    vehicleNo: "PQR-1357",
    riskLevel: "HIGH",
    gpsLocation: {
      latitude: 6.9133,
      longitude: 79.8389,
      address: "Colombo 01, Sri Lanka"
    },
    timestamp: "2024-01-22T18:10:35.000Z"
  },
  {
    accidentId: "ACC-2024-009",
    vehicleNo: "STU-8024",
    riskLevel: "LOW",
    gpsLocation: {
      latitude: 6.9278,
      longitude: 79.8492,
      address: "Colombo 07, Sri Lanka"
    },
    timestamp: "2024-01-23T10:40:50.000Z"
  },
  {
    accidentId: "ACC-2024-010",
    vehicleNo: "VWX-4680",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9356,
      longitude: 79.8618,
      address: "Colombo 05, Sri Lanka"
    },
    timestamp: "2024-01-24T15:25:15.000Z"
  },
  {
    accidentId: "ACC-2024-011",
    vehicleNo: "YZA-7913",
    riskLevel: "HIGH",
    gpsLocation: {
      latitude: 6.9221,
      longitude: 79.8554,
      address: "Colombo 03, Sri Lanka"
    },
    timestamp: "2024-01-25T12:15:40.000Z"
  },
  {
    accidentId: "ACC-2024-012",
    vehicleNo: "BCD-2468",
    riskLevel: "LOW",
    gpsLocation: {
      latitude: 6.9189,
      longitude: 79.8445,
      address: "Colombo 04, Sri Lanka"
    },
    timestamp: "2024-01-26T09:30:25.000Z"
  },
  {
    accidentId: "ACC-2024-013",
    vehicleNo: "EFG-5791",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9298,
      longitude: 79.8591,
      address: "Colombo 06, Sri Lanka"
    },
    timestamp: "2024-01-27T14:50:10.000Z"
  },
  {
    accidentId: "ACC-2024-014",
    vehicleNo: "HIJ-8024",
    riskLevel: "HIGH",
    gpsLocation: {
      latitude: 6.9145,
      longitude: 79.8512,
      address: "Colombo 02, Sri Lanka"
    },
    timestamp: "2024-01-28T17:35:55.000Z"
  },
  {
    accidentId: "ACC-2024-015",
    vehicleNo: "KLM-1357",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9378,
      longitude: 79.8634,
      address: "Colombo 08, Sri Lanka"
    },
    timestamp: "2024-01-29T08:20:30.000Z"
  },
  {
    accidentId: "ACC-2024-016",
    vehicleNo: "NOP-4680",
    riskLevel: "LOW",
    gpsLocation: {
      latitude: 6.9245,
      longitude: 79.8487,
      address: "Colombo 01, Sri Lanka"
    },
    timestamp: "2024-01-30T11:45:20.000Z"
  },
  {
    accidentId: "ACC-2024-017",
    vehicleNo: "QRS-7913",
    riskLevel: "HIGH",
    gpsLocation: {
      latitude: 6.9323,
      longitude: 79.8565,
      address: "Colombo 07, Sri Lanka"
    },
    timestamp: "2024-01-31T16:10:45.000Z"
  },
  {
    accidentId: "ACC-2024-018",
    vehicleNo: "TUV-2468",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9201,
      longitude: 79.8421,
      address: "Colombo 05, Sri Lanka"
    },
    timestamp: "2024-02-01T13:30:15.000Z"
  },
  {
    accidentId: "ACC-2024-019",
    vehicleNo: "WXY-5791",
    riskLevel: "LOW",
    gpsLocation: {
      latitude: 6.9167,
      longitude: 79.8538,
      address: "Colombo 03, Sri Lanka"
    },
    timestamp: "2024-02-02T10:15:50.000Z"
  },
  {
    accidentId: "ACC-2024-020",
    vehicleNo: "ZAB-8024",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9342,
      longitude: 79.8601,
      address: "Colombo 06, Sri Lanka"
    },
    timestamp: "2024-02-03T15:55:25.000Z"
  },
  {
    accidentId: "ACC-2024-021",
    vehicleNo: "ABC-1234",
    riskLevel: "HIGH",
    gpsLocation: {
      latitude: 6.9198,
      longitude: 79.8465,
      address: "Colombo 04, Sri Lanka"
    },
    timestamp: "2024-02-04T19:20:40.000Z"
  },
  {
    accidentId: "ACC-2024-022",
    vehicleNo: "CDE-1357",
    riskLevel: "LOW",
    gpsLocation: {
      latitude: 6.9287,
      longitude: 79.8589,
      address: "Colombo 08, Sri Lanka"
    },
    timestamp: "2024-02-05T07:40:10.000Z"
  },
  {
    accidentId: "ACC-2024-023",
    vehicleNo: "FGH-4680",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9254,
      longitude: 79.8503,
      address: "Colombo 02, Sri Lanka"
    },
    timestamp: "2024-02-06T12:25:35.000Z"
  },
  {
    accidentId: "ACC-2024-024",
    vehicleNo: "IJK-7913",
    riskLevel: "HIGH",
    gpsLocation: {
      latitude: 6.9365,
      longitude: 79.8627,
      address: "Colombo 01, Sri Lanka"
    },
    timestamp: "2024-02-07T18:50:20.000Z"
  },
  {
    accidentId: "ACC-2024-025",
    vehicleNo: "LMN-2468",
    riskLevel: "MEDIUM",
    gpsLocation: {
      latitude: 6.9212,
      longitude: 79.8456,
      address: "Colombo 07, Sri Lanka"
    },
    timestamp: "2024-02-08T14:15:55.000Z"
  }
];

module.exports = accidents;

