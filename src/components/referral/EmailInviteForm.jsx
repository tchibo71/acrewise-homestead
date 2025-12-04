import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmailInviteForm({ user, referralUrl }) {
  const queryClient = useQueryClient();
  const [emails, setEmails] = useState([""]);
  const [customMessage, setCustomMessage] = useState("");
  const [sendStatus, setSendStatus] = useState({ type: null, message: "" });

  const sendInviteMutation = useMutation({
    mutationFn: async ({ toEmail, message }) => {
      const emailBody = `Hi there!

${user?.full_name || "Your friend"} has invited you to join Homestead Acres - the complete homesteading management platform.

${message ? `Personal message: "${message}"` : ""}

With Homestead Acres, you can:
• Track livestock health, breeding, and production
• Plan crops, gardens, and rotations
• Manage farm finances and budgets
• Access AI-powered advice for your scenarios
• And much more!

Sign up using this special referral link to get started:
${referralUrl}

When you subscribe within 30 days, both you and ${user?.full_name || "your friend"} earn rewards!

Happy Homesteading!
The Homestead Acres Team`;

      await base44.integrations.Core.SendEmail({
        to: toEmail,
        subject: `${user?.full_name || "A friend"} invites you to Homestead Acres! 🌱`,
        body: emailBody
      });

      // Create referral record for tracking
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      await base44.entities.Referral.create({
        referrer_email: user.email,
        referral_code: user.email.replace('@', '-at-'),
        referred_email: toEmail,
        status: 'pending',
        click_date: new Date().toISOString().split('T')[0],
        expiration_date: expirationDate.toISOString().split('T')[0]
      });

      return { toEmail };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    }
  });

  const handleAddEmail = () => {
    if (emails.length < 5) {
      setEmails([...emails, ""]);
    }
  };

  const handleRemoveEmail = (index) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSendInvites = async () => {
    const validEmails = emails.filter(email => email.trim() && email.includes('@'));
    
    if (validEmails.length === 0) {
      setSendStatus({ type: "error", message: "Please enter at least one valid email address" });
      return;
    }

    setSendStatus({ type: "sending", message: `Sending ${validEmails.length} invite(s)...` });

    let successCount = 0;
    let failCount = 0;

    for (const email of validEmails) {
      try {
        await sendInviteMutation.mutateAsync({ toEmail: email.trim(), message: customMessage });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      setSendStatus({ 
        type: "success", 
        message: `Successfully sent ${successCount} invite(s)!${failCount > 0 ? ` (${failCount} failed)` : ''}`
      });
      setEmails([""]);
      setCustomMessage("");
    } else {
      setSendStatus({ type: "error", message: "Failed to send invites. Please try again." });
    }

    setTimeout(() => setSendStatus({ type: null, message: "" }), 5000);
  };

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Mail className="w-5 h-5" />
          Invite Friends via Email
          <Badge className="bg-green-100 text-green-700 ml-2">Earn Free Month!</Badge>
        </CardTitle>
        <p className="text-sm text-purple-700">
          Send personalized invites directly to your friends. When they subscribe, you earn referral credits!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-purple-900 font-medium">Email Addresses (up to 5)</Label>
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                className="border-purple-200 focus:border-purple-400"
              />
              {emails.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveEmail(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {emails.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEmail}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Another Email
            </Button>
          )}
        </div>

        <div>
          <Label className="text-purple-900 font-medium">Personal Message (optional)</Label>
          <Textarea
            placeholder="Add a personal note to make your invite more meaningful..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            className="mt-2 border-purple-200 focus:border-purple-400"
          />
        </div>

        {sendStatus.type && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            sendStatus.type === "success" ? "bg-green-100 text-green-800" :
            sendStatus.type === "error" ? "bg-red-100 text-red-800" :
            "bg-blue-100 text-blue-800"
          }`}>
            {sendStatus.type === "success" && <CheckCircle2 className="w-5 h-5" />}
            {sendStatus.type === "error" && <AlertCircle className="w-5 h-5" />}
            {sendStatus.type === "sending" && <Loader2 className="w-5 h-5 animate-spin" />}
            <span className="font-medium">{sendStatus.message}</span>
          </div>
        )}

        <Button
          onClick={handleSendInvites}
          disabled={sendInviteMutation.isPending || sendStatus.type === "sending"}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          {sendStatus.type === "sending" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending Invites...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Invite{emails.filter(e => e.trim()).length > 1 ? 's' : ''}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-purple-600">
          Each validated referral earns you credits toward a free month!
        </p>
      </CardContent>
    </Card>
  );
}