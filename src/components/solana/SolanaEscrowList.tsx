import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign,
  Calendar,
  FileText,
  ThumbsUp,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export interface SolanaEscrowData {
  id: number;
  creator: string;
  beneficiary: string;
  amount_lamports: number;
  approver1: string;
  approver2: string;
  approver3?: string | null;
  description: string;
  approvals: string[];
  is_completed: boolean;
  created_at: number;
  completed_at?: number | null;
}

interface SolanaEscrowListProps {
  escrows: SolanaEscrowData[];
  currentAddress?: string;
  onApprove: (escrowId: number) => void;
  onCancel: (escrowId: number) => void;
  isLoading?: boolean;
}

export const SolanaEscrowList = ({ 
  escrows, 
  currentAddress, 
  onApprove, 
  onCancel,
  isLoading 
}: SolanaEscrowListProps) => {
  const { toast } = useToast();

  const getEscrowStatus = (escrow: SolanaEscrowData) => {
    if (escrow.is_completed) return "completed";
    if (escrow.approvals.length === 0) return "pending";
    return "approved";
  };

  const formatAmount = (lamports: number) => {
    const sol = lamports / LAMPORTS_PER_SOL;
    return `${sol.toFixed(4)} SOL`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const canApprove = (escrow: SolanaEscrowData) => {
    if (!currentAddress || escrow.is_completed) return false;
    
    const isApprover = [escrow.approver1, escrow.approver2, escrow.approver3]
      .filter(Boolean)
      .includes(currentAddress);
    
    const hasAlreadyApproved = escrow.approvals.includes(currentAddress);
    
    return isApprover && !hasAlreadyApproved;
  };

  const canCancel = (escrow: SolanaEscrowData) => {
    if (!currentAddress || escrow.is_completed) return false;
    return escrow.creator === currentAddress && escrow.approvals.length === 0;
  };

  const handleApprove = (escrowId: number) => {
    onApprove(escrowId);
    toast({
      title: "Approval Submitted",
      description: "Your approval transaction is being submitted to Solana.",
    });
  };

  const handleCancel = (escrowId: number) => {
    onCancel(escrowId);
    toast({
      title: "Cancellation Submitted",
      description: "Escrow cancellation transaction is being submitted.",
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
      <Card className="text-center py-12 border-purple-500/20">
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-purple-500/10">
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No Escrows Found</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any Solana escrows yet. Create your first escrow to get started.
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
          <Card key={escrow.id} className="card-gradient border-purple-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Escrow #{escrow.id}</CardTitle>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4 text-purple-500" />
                    <Badge 
                      className={
                        status === "completed" ? "bg-green-500/20 text-green-500" :
                        status === "approved" ? "bg-purple-500/20 text-purple-500" : 
                        "bg-yellow-500/20 text-yellow-500"
                      }
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-purple-500 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {formatAmount(escrow.amount_lamports)}
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
                    <p className="font-mono">{formatAddress(escrow.creator)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Beneficiary:</span>
                    <p className="font-mono">{formatAddress(escrow.beneficiary)}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Approvals:</span>
                    <span className="font-medium text-purple-500">
                      {escrow.approvals.length}/{[escrow.approver1, escrow.approver2, escrow.approver3].filter(Boolean).length}
                    </span>
                  </div>
                  {escrow.approvals.length > 0 && (
                    <div className="text-xs text-green-500">
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
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
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

