import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateEscrowProps {
  onCreateEscrow: (escrowData: EscrowFormData) => void;
  isCreating: boolean;
}

export interface EscrowFormData {
  beneficiary: string;
  approver1: string;
  approver2: string;
  approver3?: string;
  description: string;
  amount: string;
  denom: string; // Display-only in UI (always ATOM)
}

export const CreateEscrow = ({ onCreateEscrow, isCreating }: CreateEscrowProps) => {
  const [formData, setFormData] = useState<EscrowFormData>({
    beneficiary: "",
    approver1: "",
    approver2: "",
    approver3: "",
    description: "",
    amount: "",
    denom: "ATOM"
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.beneficiary || !formData.approver1 || !formData.approver2 || !formData.description || !formData.amount) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate addresses for Cosmos Hub mainnet (bech32 with hrp 'cosmos')
    const cosmosAddressRegex = /^cosmos1[0-9a-z]{38,}$/;
    if (!cosmosAddressRegex.test(formData.beneficiary)) {
      toast({
        title: "Invalid Address",
        description: "Beneficiary must be a valid Cosmos address (cosmos1...).",
        variant: "destructive",
      });
      return;
    }

    if (!cosmosAddressRegex.test(formData.approver1)) {
      toast({
        title: "Invalid Address",
        description: "Approver 1 must be a valid Cosmos address (cosmos1...).",
        variant: "destructive",
      });
      return;
    }

    if (!cosmosAddressRegex.test(formData.approver2)) {
      toast({
        title: "Invalid Address",
        description: "Approver 2 must be a valid Cosmos address (cosmos1...).",
        variant: "destructive",
      });
      return;
    }

    if (formData.approver3 && !cosmosAddressRegex.test(formData.approver3)) {
      toast({
        title: "Invalid Address",
        description: "Approver 3 must be a valid Cosmos address (cosmos1...).",
        variant: "destructive",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be a positive number.",
        variant: "destructive",
      });
      return;
    }


    onCreateEscrow(formData);
  };

  const handleInputChange = (field: keyof EscrowFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary" />
          Create New Escrow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Section */}
          <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 text-primary">
              <DollarSign className="h-4 w-4" />
              <h3 className="font-medium">Escrow Amount</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="e.g., 0.5"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="denom">Currency</Label>
                <Input
                  id="denom"
                  value={formData.denom}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="space-y-4 p-4 rounded-lg bg-success/5 border border-success/10">
            <div className="flex items-center gap-2 text-success">
              <Users className="h-4 w-4" />
              <h3 className="font-medium">Parties & Approvers</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiary">Beneficiary Address *</Label>
                <Input
                  id="beneficiary"
                  placeholder="cosmos1..."
                  value={formData.beneficiary}
                  onChange={(e) => handleInputChange("beneficiary", e.target.value)}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Address that will receive the funds when released</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="approver1">First Approver *</Label>
                  <Input
                    id="approver1"
                    placeholder="cosmos1..."
                    value={formData.approver1}
                    onChange={(e) => handleInputChange("approver1", e.target.value)}
                    required
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approver2">Second Approver *</Label>
                  <Input
                    id="approver2"
                    placeholder="cosmos1..."
                    value={formData.approver2}
                    onChange={(e) => handleInputChange("approver2", e.target.value)}
                    required
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver3">Third Approver (Optional)</Label>
                <Input
                  id="approver3"
                  placeholder="cosmos1..."
                  value={formData.approver3}
                  onChange={(e) => handleInputChange("approver3", e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Escrow Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the terms and conditions of this escrow..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full btn-gradient-cosmic text-primary-foreground py-3"
            size="lg"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Creating Escrow...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Escrow
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};