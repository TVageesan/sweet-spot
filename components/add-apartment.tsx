"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface AddApartmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ApartmentFormData) => void;
}

export interface ApartmentFormData {
  url: string;
  address: string;
  rooms: string;
  rent: string;
}

export function AddApartment({
  open,
  onOpenChange,
  onSubmit,
}: AddApartmentProps) {
  const [formData, setFormData] = useState<ApartmentFormData>({
    url: "",
    address: "",
    rooms: "",
    rent: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (data: ApartmentFormData) => {
    console.log('formData', formData)
    return (
      data.url.trim() !== "" &&
      data.address.trim() !== "" &&
      data.rooms.trim() !== "" &&
      data.rent.trim() !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) {
      alert("Unable to submit: Missing fields!");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    onSubmit(formData);
    setFormData({ url: "", address: "", rooms: "", rent: "" });
    setIsSubmitting(false);
  };

  const handleInputChange = (field: keyof ApartmentFormData, value: string) => {
    console.log("field", field,"value", value)
    if (!isSubmitting) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isSubmitting) return;
    if (!newOpen) {
      setFormData({ url: "", address: "", rooms: "", rent: "" });
      setIsSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[420px] bg-gray-800 border-gray-700 text-white"
        onPointerDownOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-white text-lg">
            Add New Apartment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* URL Field */}
          <div className="space-y-1">
            <Label htmlFor="url" className="text-xs font-medium text-gray-300">
              Listing URL
            </Label>
            <Input
              required
              id="url"
              type="url"
              className="bg-gray-700 border-gray-600 text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-8"
              value={formData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Address Field */}
          <div className="space-y-1">
            <Label htmlFor="address" className="text-xs font-medium text-gray-300">
              Home Address
            </Label>
            <Input
              required
              id="address"
              type="text"
              className="bg-gray-700 border-gray-600 text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-8"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Number of Rooms */}
          <div className="space-y-1">
            <Label htmlFor="rooms" className="text-xs font-medium text-gray-300">
              Number of Rooms
            </Label>
            <Input
              required
              id="rooms"
              type="number"
              min="1"
              max="10"
              className="bg-gray-700 border-gray-600 text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-8"
              value={formData.rooms}
              onChange={(e) => handleInputChange("rooms", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Monthly Rent */}
          <div className="space-y-1">
            <Label htmlFor="rent" className="text-xs font-medium text-gray-300">
              Total Rent per Month (€)
            </Label>
            <div className="relative">
              <Input
                required
                id="rent"
                type="string"
                min="0"
                className="bg-gray-700 border-gray-600 text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-8 h-8"
                value={formData.rent}
                onChange={(e) => handleInputChange("rent", e.target.value)}
                disabled={isSubmitting}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
                €
              </span>
            </div>
          </div>
        </form>

        <DialogFooter className="flex gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-500 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Calculate Routes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
