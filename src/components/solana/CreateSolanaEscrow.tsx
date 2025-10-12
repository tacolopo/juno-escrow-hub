import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PublicKey } from "@solana/web3.js";

interface CreateSolanaEscrowProps {
  onCreateEscrow: (escrowData: SolanaEscrowFormData) => void;
  isCreating: boolean;
}

export interface SolanaEscrowFormData {
  beneficiary: string;
  approver1: string;
  approver2: string;
  approver3?: string;
  description: string;
  amount: string;
  denom: string;
}

export const CreateSolanaEscrow = ({ onCreateEscrow, isCreating }: CreateSolanaEscrowProps) => {
  const [formData, setFormData] = useState<SolanaEscrowFormData>({
    beneficiary: "",
    approver1: "",
    approver2: "",
    approver3: "",
    description: "",
    amount: "",
    denom: "SOL"
  });

  const { toast } = useToast();

  const isValidSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

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

    // Validate Solana addresses
    if (!isValidSolanaAddress(formData.beneficiary)) {
      toast({
        title: "Invalid Address",
        description: "Beneficiary must be a valid Solana address.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidSolanaAddress(formData.approver1)) {
      toast({
        title: "Invalid Address",
        description: "Approver 1 must be a valid Solana address.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidSolanaAddress(formData.approver2)) {
      toast({
        title: "Invalid Address",
        description: "Approver 2 must be a valid Solana address.",
        variant: "destructive",
      });
      return;
    }

    if (formData.approver3 && !isValidSolanaAddress(formData.approver3)) {
      toast({
        title: "Invalid Address",
        description: "Approver 3 must be a valid Solana address.",
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

  const handleInputChange = (field: keyof SolanaEscrowFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="card-gradient border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-purple-500" />
          Create New Solana Escrow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Section */}
          <div className="space-y-4 p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
            <div className="flex items-center gap-2 text-purple-500">
              <DollarSign className="h-4 w-4" />
              <h3 className="font-medium">Escrow Amount</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (SOL) *</Label>
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
          <div className="space-y-4 p-4 rounded-lg bg-pink-500/5 border border-pink-500/10">
            <div className="flex items-center gap-2 text-pink-500">
              <Users className="h-4 w-4" />
              <h3 className="font-medium">Parties & Approvers</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiary">Beneficiary Address *</Label>
                <Input
                  id="beneficiary"
                  placeholder="Solana public key..."
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
                    placeholder="Solana public key..."
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
                    placeholder="Solana public key..."
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
                  placeholder="Solana public key..."
                  value={formData.approver3}
                  onChange={(e) => handleInputChange("approver3", e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">3 approvers require 2 of 3 approvals</p>
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 hover:from-purple-600 hover:to-pink-600"
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

