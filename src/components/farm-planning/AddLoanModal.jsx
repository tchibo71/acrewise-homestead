import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddLoanModal({ loan, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    loan_name: "",
    lender: "",
    loan_type: "equipment",
    original_amount: 0,
    current_balance: 0,
    interest_rate: 0,
    term_months: 60,
    monthly_payment: 0,
    start_date: new Date().toISOString().split('T')[0],
    status: "active",
    notes: ""
  });

  useEffect(() => {
    if (loan) {
      setFormData(loan);
    }
  }, [loan]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (loan) {
        return base44.entities.FinancialLoan.update(loan.id, data);
      }
      return base44.entities.FinancialLoan.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loan ? "Edit Loan" : "Add Loan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Loan Name *</Label>
            <Input
              value={formData.loan_name}
              onChange={(e) => setFormData({...formData, loan_name: e.target.value})}
              required
              placeholder="e.g., Tractor Loan, Land Mortgage"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Lender *</Label>
              <Input
                value={formData.lender}
                onChange={(e) => setFormData({...formData, lender: e.target.value})}
                required
                placeholder="Bank or lender name"
              />
            </div>

            <div>
              <Label>Loan Type *</Label>
              <Select value={formData.loan_type} onValueChange={(value) => setFormData({...formData, loan_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="equipment">Equipment Loan</SelectItem>
                  <SelectItem value="operating">Operating Loan</SelectItem>
                  <SelectItem value="line_of_credit">Line of Credit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Original Amount ($) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.original_amount}
                onChange={(e) => setFormData({...formData, original_amount: Number(e.target.value)})}
                required
              />
            </div>

            <div>
              <Label>Current Balance ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.current_balance}
                onChange={(e) => setFormData({...formData, current_balance: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => setFormData({...formData, interest_rate: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Term (Months)</Label>
              <Input
                type="number"
                min="1"
                value={formData.term_months}
                onChange={(e) => setFormData({...formData, term_months: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly Payment ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.monthly_payment}
                onChange={(e) => setFormData({...formData, monthly_payment: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paid_off">Paid Off</SelectItem>
                <SelectItem value="refinanced">Refinanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : loan ? "Update Loan" : "Add Loan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}