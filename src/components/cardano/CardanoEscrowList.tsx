import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Users, Coins, Clock, Shield } from "lucide-react";
import { UTxO } from "lucid-cardano";

export interface CardanoEscrowData {
  id: number;
  creator: string;
  beneficiary: string;
  amount: number;
  approver1: string;
  approver2: string;
  approver3?: string;
  description: string;
  approvals: string[];
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
  utxo: UTxO;
}

interface CardanoEscrowListProps {
  escrows: CardanoEscrowData[];
  currentAddress: string;
  onApprove: (escrow: CardanoEscrowData) => Promise<void>;
  onCancel: (escrow: CardanoEscrowData) => Promise<void>;
  isLoading: boolean;
}

export const CardanoEscrowList = ({
  escrows,
  currentAddress,
  onApprove,
  onCancel,
  isLoading,
}: CardanoEscrowListProps) => {
  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isApprover = (escrow: CardanoEscrowData): boolean => {
    const approvers = [escrow.approver1, escrow.approver2, escrow.approver3].filter(Boolean);
    return approvers.includes(currentAddress);
  };

  const hasApproved = (escrow: CardanoEscrowData): boolean => {
    return escrow.approvals.some((approval) => approval === currentAddress);
  };

  const isCreator = (escrow: CardanoEscrowData): boolean => {
    return escrow.creator === currentAddress;
  };

  const canApprove = (escrow: CardanoEscrowData): boolean => {
    return !escrow.isCompleted && isApprover(escrow) && !hasApproved(escrow);
  };

  const canCancel = (escrow: CardanoEscrowData): boolean => {
    return !escrow.isCompleted && isCreator(escrow) && escrow.approvals.length === 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (escrows.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Escrows Found</h3>
        <p className="text-sm text-muted-foreground">
          Create your first escrow to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {escrows.map((escrow) => (
        <Card
          key={escrow.id}
          className={`transition-all ${
            escrow.isCompleted
              ? "bg-green-500/5 border-green-500/20"
              : "hover:shadow-lg hover:scale-[1.02]"
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-lg">Escrow #{escrow.id}</span>
                  {escrow.isCompleted && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  {!escrow.isCompleted && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      <Clock className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{escrow.description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Amount */}
            <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Amount:</span>
              </div>
              <span className="text-lg font-bold text-primary">{escrow.amount.toFixed(6)} ADA</span>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 bg-card/30 rounded text-sm">
                <span className="text-muted-foreground">Creator:</span>
                <span className="font-mono">{formatAddress(escrow.creator)}</span>
                {isCreator(escrow) && (
                  <Badge variant="secondary" className="ml-2">You</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-card/30 rounded text-sm">
                <span className="text-muted-foreground">Beneficiary:</span>
                <span className="font-mono">{formatAddress(escrow.beneficiary)}</span>
              </div>
            </div>

            {/* Approvers */}
            <div className="space-y-2 p-3 bg-card/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Approvals: {escrow.approvals.length} / 2 required
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono">{formatAddress(escrow.approver1)}</span>
                  {escrow.approvals.includes(escrow.approver1) ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground opacity-30" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono">{formatAddress(escrow.approver2)}</span>
                  {escrow.approvals.includes(escrow.approver2) ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground opacity-30" />
                  )}
                </div>
                {escrow.approver3 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono">{formatAddress(escrow.approver3)}</span>
                    {escrow.approvals.includes(escrow.approver3) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground opacity-30" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Created: {formatDate(escrow.createdAt)}</span>
              {escrow.completedAt && (
                <span className="ml-2">• Completed: {formatDate(escrow.completedAt)}</span>
              )}
            </div>

            {/* Actions */}
            {!escrow.isCompleted && (
              <div className="flex gap-2 pt-2">
                {canApprove(escrow) && (
                  <Button
                    onClick={() => onApprove(escrow)}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Release
                  </Button>
                )}
                
                {canCancel(escrow) && (
                  <Button
                    onClick={() => onCancel(escrow)}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Escrow
                  </Button>
                )}

                {!canApprove(escrow) && !canCancel(escrow) && (
                  <div className="flex-1 text-center text-sm text-muted-foreground py-2">
                    {hasApproved(escrow) ? "You have already approved" : "Waiting for approvals"}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

