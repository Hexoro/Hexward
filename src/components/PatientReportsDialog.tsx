/**
 * Patient reports viewer dialog
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Report {
  id: string;
  title: string;
  report_type: string;
  description?: string;
  data: any;
  created_at: string;
  generated_by?: string;
}

interface Consultation {
  id: string;
  start_time: string;
  end_time?: string;
  status: string;
  type: string;
  diagnosis?: string;
  treatment_plan?: string;
  notes?: string;
}

interface PatientReportsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export default function PatientReportsDialog({ isOpen, onClose, patientId, patientName }: PatientReportsDialogProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'consultations'>('reports');

  const fetchReports = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      // Fetch reports related to this patient
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .contains('data', { patient_id: patientId })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    if (!patientId) return;
    
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast.error('Failed to load consultations');
    }
  };

  useEffect(() => {
    if (isOpen && patientId) {
      fetchReports();
      fetchConsultations();
    }
  }, [isOpen, patientId]);

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'scheduled': return 'bg-primary text-primary-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const generatePatientSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          title: `Patient Summary - ${patientName}`,
          report_type: 'patient_summary',
          description: `Comprehensive summary for patient ${patientName}`,
          data: {
            patient_id: patientId,
            generated_at: new Date().toISOString(),
            summary_type: 'comprehensive'
          }
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Patient summary generated');
      fetchReports();
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate patient summary');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Reports & Records - {patientName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'reports' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('reports')}
            size="sm"
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Reports ({reports.length})
          </Button>
          <Button
            variant={activeTab === 'consultations' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('consultations')}
            size="sm"
            className="flex-1"
          >
            <User className="w-4 h-4 mr-2" />
            Consultations ({consultations.length})
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'reports' && (
              <>
                <div className="flex justify-end">
                  <Button onClick={generatePatientSummary} size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Summary
                  </Button>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No reports found</p>
                    <Button onClick={generatePatientSummary} className="mt-4">
                      Generate First Report
                    </Button>
                  </div>
                ) : (
                  reports.map((report) => (
                    <Card key={report.id} className="medical-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {report.report_type}
                            </span>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {report.description && (
                          <p className="text-muted-foreground mb-3">{report.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(report.created_at)}</span>
                          </div>
                          {report.generated_by && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>Generated by system</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}

            {activeTab === 'consultations' && (
              <>
                {consultations.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No consultations found</p>
                  </div>
                ) : (
                  consultations.map((consultation) => (
                    <Card key={consultation.id} className="medical-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {consultation.type === 'remote' ? 'Remote' : 'In-Person'} Consultation
                          </CardTitle>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(consultation.status)}`}>
                            {consultation.status}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>Started: {formatDateTime(consultation.start_time)}</span>
                          </div>
                          {consultation.end_time && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>Ended: {formatDateTime(consultation.end_time)}</span>
                            </div>
                          )}
                        </div>

                        {consultation.diagnosis && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                            <p className="text-sm bg-muted/50 p-2 rounded">{consultation.diagnosis}</p>
                          </div>
                        )}

                        {consultation.treatment_plan && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Treatment Plan</p>
                            <p className="text-sm bg-muted/50 p-2 rounded">{consultation.treatment_plan}</p>
                          </div>
                        )}

                        {consultation.notes && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Notes</p>
                            <p className="text-sm bg-muted/50 p-2 rounded">{consultation.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}