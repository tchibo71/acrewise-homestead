import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

export function ConfirmDeleteDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Delete Record",
  description,
  itemName 
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              {description || `Are you sure you want to delete "${itemName}"?`}
            </p>
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-900 font-bold text-lg">
                THIS ACTION IS PERMANENT
              </p>
              <p className="text-red-800 text-sm mt-1">
                Deleted records cannot be recovered. All associated data will be permanently removed.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}