import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Coins } from "lucide-react";

export interface CardanoEscrowFormData {
  beneficiary: string;
  amount: string;
  approver1: string;
  approver2: string;
  approver3?: string;
  description: string;
}

interface CardanoCreateEscrowProps {
  onCreateEscrow: (formData: CardanoEscrowFormData) => Promise<void>;
  isCreating: boolean;
}

export const CardanoCreateEscrow = ({ onCreateEscrow, isCreating }: CardanoCreateEscrowProps) => {
  const [formData, setFormData] = useState<CardanoEscrowFormData>({
    beneficiary: "",
    amount: "",
    approver1: "",
    approver2: "",
    approver3: "",
    description: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CardanoEscrowFormData, string>>>({});

  const validateAddress = (address: string): boolean => {
    // Cardano address validation (mainnet addresses start with "addr1")
    return address.startsWith("addr1") && address.length >= 58;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CardanoEscrowFormData, string>> = {};

    if (!formData.beneficiary) {
      newErrors.beneficiary = "Beneficiary address is required";
    } else if (!validateAddress(formData.beneficiary)) {
      newErrors.beneficiary = "Invalid Cardano address";
    }

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (parseFloat(formData.amount) < 2) {
      newErrors.amount = "Minimum amount is 2 ADA (covers script min UTXO)";
    }

    if (!formData.approver1) {
      newErrors.approver1 = "First approver is required";
    } else if (!validateAddress(formData.approver1)) {
      newErrors.approver1 = "Invalid Cardano address";
    }

    if (!formData.approver2) {
      newErrors.approver2 = "Second approver is required";
    } else if (!validateAddress(formData.approver2)) {
      newErrors.approver2 = "Invalid Cardano address";
    }

    if (formData.approver3 && !validateAddress(formData.approver3)) {
      newErrors.approver3 = "Invalid Cardano address";
    }

    if (!formData.description) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    // Check for duplicate approvers
    const approvers = [formData.approver1, formData.approver2, formData.approver3].filter(Boolean);
    const uniqueApprovers = new Set(approvers);
    if (approvers.length !== uniqueApprovers.size) {
      newErrors.approver1 = "Approvers must be unique";
      newErrors.approver2 = "Approvers must be unique";
      if (formData.approver3) newErrors.approver3 = "Approvers must be unique";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    await onCreateEscrow(formData);
    
    // Reset form on success
    setFormData({
      beneficiary: "",
      amount: "",
      approver1: "",
      approver2: "",
      approver3: "",
      description: "",
    });
    setErrors({});
  };

  const handleChange = (field: keyof CardanoEscrowFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Create New Escrow
        </CardTitle>
        <CardDescription>
          Lock ADA in a multi-signature escrow requiring 2 out of 2-3 approvers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Amount (ADA)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="10.0"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum 2 ADA required for script UTXO
            </p>
          </div>

          {/* Beneficiary */}
          <div className="space-y-2">
            <Label htmlFor="beneficiary">Beneficiary Address</Label>
            <Input
              id="beneficiary"
              placeholder="addr1..."
              value={formData.beneficiary}
              onChange={(e) => handleChange("beneficiary", e.target.value)}
              className={errors.beneficiary ? "border-destructive" : ""}
            />
            {errors.beneficiary && (
              <p className="text-sm text-destructive">{errors.beneficiary}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The address that will receive funds when escrow is released
            </p>
          </div>

          {/* Approvers */}
          <div className="space-y-4 p-4 bg-card/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Approvers (2-3 required)</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="approver1">First Approver *</Label>
              <Input
                id="approver1"
                placeholder="addr1..."
                value={formData.approver1}
                onChange={(e) => handleChange("approver1", e.target.value)}
                className={errors.approver1 ? "border-destructive" : ""}
              />
              {errors.approver1 && (
                <p className="text-sm text-destructive">{errors.approver1}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="approver2">Second Approver *</Label>
              <Input
                id="approver2"
                placeholder="addr1..."
                value={formData.approver2}
                onChange={(e) => handleChange("approver2", e.target.value)}
                className={errors.approver2 ? "border-destructive" : ""}
              />
              {errors.approver2 && (
                <p className="text-sm text-destructive">{errors.approver2}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="approver3">Third Approver (Optional)</Label>
              <Input
                id="approver3"
                placeholder="addr1..."
                value={formData.approver3}
                onChange={(e) => handleChange("approver3", e.target.value)}
                className={errors.approver3 ? "border-destructive" : ""}
              />
              {errors.approver3 && (
                <p className="text-sm text-destructive">{errors.approver3}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Requires 2 approvals to release funds
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this escrow..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={errors.description ? "border-destructive" : ""}
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters
            </p>
          </div>

          <Button type="submit" disabled={isCreating} className="w-full" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            {isCreating ? "Creating Escrow..." : "Create Escrow"}
          </Button>

          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground text-center">
              Transaction will require your signature and will be submitted to Cardano mainnet
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

