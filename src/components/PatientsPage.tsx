/**
 * Patients management page
 */
import { useState, useEffect } from "react";
import { Users, Search, Eye, Edit, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddPatientDialog from "./AddPatientDialog";
import VitalsRecordingDialog from "./VitalsRecordingDialog";
import ConsultationBookingDialog from "./ConsultationBookingDialog";

interface Patient {
  id: string;
  name: string;
  age?: number;
  room?: string;
  status?: string;
  admission_date?: string;
  created_at?: string;
  conditions?: string[];
  vitals?: any;
  notes?: string;
  summary?: string;
}


const statusColors = {
  stable: 'bg-success text-success-foreground',
  critical: 'bg-destructive text-destructive-foreground',
  monitoring: 'bg-warning text-warning-foreground'
};

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('patients_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'patients'
      }, () => {
        fetchPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.room && patient.room.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'No data';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

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
        <AddPatientDialog onPatientAdded={fetchPatients} />
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
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading patients...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No patients found</p>
                </div>
              ) : (
                filteredPatients.map((patient) => (
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
                          <p className="text-sm text-muted-foreground">
                            {patient.age ? `Age ${patient.age}` : 'Age not specified'} • {patient.room || 'No room assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          patient.status && statusColors[patient.status as keyof typeof statusColors] ? statusColors[patient.status as keyof typeof statusColors] : 'bg-muted text-muted-foreground'
                        }`}>
                          {patient.status || 'unknown'}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {patient.vitals && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Heart Rate</p>
                          <p className="font-medium">{patient.vitals.heartRate || 'N/A'} {patient.vitals.heartRate ? 'bpm' : ''}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Blood Pressure</p>
                          <p className="font-medium">{patient.vitals.bloodPressure || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Temperature</p>
                          <p className="font-medium">{patient.vitals.temperature ? `${patient.vitals.temperature}°F` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">O2 Sat</p>
                          <p className="font-medium">{patient.vitals.oxygenSat ? `${patient.vitals.oxygenSat}%` : 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Updated {getTimeAgo(patient.created_at)}</span>
                      </div>
                      <div className="flex space-x-1">
                        {patient.conditions && patient.conditions.slice(0, 2).map((condition, idx) => (
                          <span key={idx} className="px-2 py-1 bg-muted text-xs rounded">
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                  <p className="text-muted-foreground">
                    {selectedPatient.age ? `Age ${selectedPatient.age}` : 'Age not specified'} • {selectedPatient.room || 'No room assigned'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPatient.status && statusColors[selectedPatient.status as keyof typeof statusColors] ? statusColors[selectedPatient.status as keyof typeof statusColors] : 'bg-muted text-muted-foreground'
                    }`}>
                      {selectedPatient.status || 'unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admission</span>
                    <span className="text-sm font-medium">
                      {selectedPatient.admission_date 
                        ? new Date(selectedPatient.admission_date).toLocaleDateString()
                        : 'Not specified'
                      }
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Conditions</p>
                    <div className="space-y-1">
                      {selectedPatient.conditions && selectedPatient.conditions.length > 0 ? (
                        selectedPatient.conditions.map((condition, idx) => (
                          <span key={idx} className="inline-block px-2 py-1 bg-muted text-xs rounded mr-1">
                            {condition}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No conditions recorded</span>
                      )}
                    </div>
                  </div>

                  {selectedPatient.vitals && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Current Vitals</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Heart Rate</span>
                          <span className="text-sm font-medium">
                            {selectedPatient.vitals.heartRate ? `${selectedPatient.vitals.heartRate} bpm` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Blood Pressure</span>
                          <span className="text-sm font-medium">{selectedPatient.vitals.bloodPressure || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Temperature</span>
                          <span className="text-sm font-medium">
                            {selectedPatient.vitals.temperature ? `${selectedPatient.vitals.temperature}°F` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Oxygen Sat</span>
                          <span className="text-sm font-medium">
                            {selectedPatient.vitals.oxygenSat ? `${selectedPatient.vitals.oxygenSat}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPatient.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Notes</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{selectedPatient.notes}</p>
                    </div>
                  )}
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