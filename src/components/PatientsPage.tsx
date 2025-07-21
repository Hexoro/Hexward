/**
 * Patients management page
 */
import { useState } from "react";
import { Users, Search, Plus, Eye, Edit, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  name: string;
  age: number;
  room: string;
  status: 'stable' | 'critical' | 'monitoring';
  admissionDate: string;
  lastUpdate: string;
  conditions: string[];
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSat: number;
  };
}

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    age: 45,
    room: 'ICU-001',
    status: 'critical',
    admissionDate: '2024-01-15',
    lastUpdate: '10 min ago',
    conditions: ['Heart Surgery', 'Hypertension'],
    vitals: { heartRate: 85, bloodPressure: '140/90', temperature: 99.2, oxygenSat: 96 }
  },
  {
    id: '2',
    name: 'Jane Smith',
    age: 32,
    room: 'WARD-101',
    status: 'stable',
    admissionDate: '2024-01-16',
    lastUpdate: '5 min ago',
    conditions: ['Pneumonia'],
    vitals: { heartRate: 72, bloodPressure: '120/80', temperature: 98.6, oxygenSat: 98 }
  },
  {
    id: '3',
    name: 'Robert Johnson',
    age: 67,
    room: 'ICU-002',
    status: 'monitoring',
    admissionDate: '2024-01-14',
    lastUpdate: '2 min ago',
    conditions: ['Stroke Recovery', 'Diabetes'],
    vitals: { heartRate: 68, bloodPressure: '130/85', temperature: 98.4, oxygenSat: 97 }
  }
];

const statusColors = {
  stable: 'bg-success text-success-foreground',
  critical: 'bg-destructive text-destructive-foreground',
  monitoring: 'bg-warning text-warning-foreground'
};

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = mockPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patients or rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>
        <Button className="medical-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients List */}
        <div className="lg:col-span-2">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Patients ({filteredPatients.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 border border-border rounded-lg hover:shadow-card transition-all cursor-pointer ${
                    selectedPatient?.id === patient.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{patient.name}</h3>
                        <p className="text-sm text-muted-foreground">Age {patient.age} • Room {patient.room}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[patient.status]}`}>
                        {patient.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Heart Rate</p>
                      <p className="font-medium">{patient.vitals.heartRate} bpm</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Blood Pressure</p>
                      <p className="font-medium">{patient.vitals.bloodPressure}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Temperature</p>
                      <p className="font-medium">{patient.vitals.temperature}°F</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">O2 Sat</p>
                      <p className="font-medium">{patient.vitals.oxygenSat}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Updated {patient.lastUpdate}</span>
                    </div>
                    <div className="flex space-x-1">
                      {patient.conditions.slice(0, 2).map((condition, idx) => (
                        <span key={idx} className="px-2 py-1 bg-muted text-xs rounded">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Patient Details */}
        <div className="space-y-6">
          {selectedPatient ? (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Patient Details</span>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-4 border-b border-border">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{selectedPatient.name}</h3>
                  <p className="text-muted-foreground">Age {selectedPatient.age} • Room {selectedPatient.room}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedPatient.status]}`}>
                      {selectedPatient.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admission</span>
                    <span className="text-sm font-medium">{selectedPatient.admissionDate}</span>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Conditions</p>
                    <div className="space-y-1">
                      {selectedPatient.conditions.map((condition, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 bg-muted text-xs rounded mr-1">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Vitals</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Heart Rate</span>
                        <span className="text-sm font-medium">{selectedPatient.vitals.heartRate} bpm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Blood Pressure</span>
                        <span className="text-sm font-medium">{selectedPatient.vitals.bloodPressure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Temperature</span>
                        <span className="text-sm font-medium">{selectedPatient.vitals.temperature}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Oxygen Sat</span>
                        <span className="text-sm font-medium">{selectedPatient.vitals.oxygenSat}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full medical-button">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Timeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="medical-card">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a patient to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}