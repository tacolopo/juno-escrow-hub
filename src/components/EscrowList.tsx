import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users, 
  DollarSign,
  Calendar,
  FileText,
  ThumbsUp,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface EscrowData {
  id: number;
  creator: string;
  beneficiary: string;
  amount: {
    amount: string;
    denom: string;
  };
  approver1: string;
  approver2: string;
  approver3?: string;
  description: string;
  approvals: string[];
  is_completed: boolean;
  created_at: number;
  completed_at?: number;
}

interface EscrowListProps {
  escrows: EscrowData[];
  currentAddress?: string;
  onApprove: (escrowId: number) => void;
  onCancel: (escrowId: number) => void;
  isLoading?: boolean;
}

export const EscrowList = ({ 
  escrows, 
  currentAddress, 
  onApprove, 
  onCancel,
  isLoading 
}: EscrowListProps) => {
  const { toast } = useToast();

  const getEscrowStatus = (escrow: EscrowData) => {
    if (escrow.is_completed) return "completed";
    if (escrow.approvals.length === 0) return "pending";
    return "approved";
  };

  const formatAmount = (amount: { amount: string; denom: string }) => {
    const value = parseFloat(amount.amount) / 1000000; // Convert from micro units
    return `${value.toFixed(6)} ${amount.denom.replace('u', '').toUpperCase()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const canApprove = (escrow: EscrowData) => {
    if (!currentAddress || escrow.is_completed) return false;
    
    const isApprover = [escrow.approver1, escrow.approver2, escrow.approver3]
      .filter(Boolean)
      .includes(currentAddress);
    
    const hasAlreadyApproved = escrow.approvals.includes(currentAddress);
    
    return isApprover && !hasAlreadyApproved;
  };

  const canCancel = (escrow: EscrowData) => {
    if (!currentAddress || escrow.is_completed) return false;
    return escrow.creator === currentAddress && escrow.approvals.length === 0;
  };

  const handleApprove = (escrowId: number) => {
    onApprove(escrowId);
    toast({
      title: "Approval Submitted",
      description: "Your approval has been submitted to the blockchain.",
    });
  };

  const handleCancel = (escrowId: number) => {
    onCancel(escrowId);
    toast({
      title: "Cancellation Submitted",
      description: "Escrow cancellation has been submitted to the blockchain.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (escrows.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted/50">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No Escrows Found</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any escrows yet. Create your first escrow to get started.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {escrows.map((escrow) => {
        const status = getEscrowStatus(escrow);
        const StatusIcon = status === "completed" ? CheckCircle : 
                          status === "approved" ? ThumbsUp : Clock;
        
        return (
          <Card key={escrow.id} className="card-gradient">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Escrow #{escrow.id}</CardTitle>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <Badge 
                      className={
                        status === "completed" ? "status-completed" :
                        status === "approved" ? "status-approved" : 
                        "status-pending"
                      }
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {formatAmount(escrow.amount)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(escrow.created_at)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">{escrow.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Creator:</span>
                    <p className="font-mono">{`${escrow.creator.slice(0, 10)}...${escrow.creator.slice(-8)}`}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Beneficiary:</span>
                    <p className="font-mono">{`${escrow.beneficiary.slice(0, 10)}...${escrow.beneficiary.slice(-8)}`}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Approvals:</span>
                    <span className="font-medium">
                      {escrow.approvals.length}/{[escrow.approver1, escrow.approver2, escrow.approver3].filter(Boolean).length}
                    </span>
                  </div>
                  {escrow.approvals.length > 0 && (
                    <div className="text-xs text-success">
                      ✓ {escrow.approvals.length} approval{escrow.approvals.length > 1 ? 's' : ''} received
                    </div>
                  )}
                </div>
              </div>
              
              {(canApprove(escrow) || canCancel(escrow)) && (
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  {canApprove(escrow) && (
                    <Button
                      onClick={() => handleApprove(escrow.id)}
                      size="sm"
                      className="btn-gradient-success text-success-foreground"
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  {canCancel(escrow) && (
                    <Button
                      onClick={() => handleCancel(escrow.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};