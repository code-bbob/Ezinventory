"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, PlusCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NewPhoneDialog = ({
  open,
  setOpen,
  newPhoneData,
  handleNewPhoneChange,
  handleNewPhoneBrandChange,
  handleAddPhone,
}) => {
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Add New Phone</DialogTitle>
          <DialogDescription className="text-slate-300">
            Enter the details of the new phone you want to add.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Phone Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newPhoneName" className="text-right text-white">
              Name
            </Label>
            <Input
              id="newPhoneName"
              name="name"
              value={newPhoneData.name}
              onChange={handleNewPhoneChange}
              className="col-span-3 bg-slate-700 border-slate-600 text-white"
              placeholder="Enter phone name"
            />
          </div>
          {/* Cost Price */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newPhoneCostPrice" className="text-right text-white">
              Cost Price
            </Label>
            <Input
              id="newPhoneCostPrice"
              name="cost_price"
              value={newPhoneData.cost_price}
              onChange={handleNewPhoneChange}
              className="col-span-3 bg-slate-700 border-slate-600 text-white"
              placeholder="Enter cost price"
            />
          </div>
          {/* Selling Price */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newPhoneSellingPrice" className="text-right text-white">
              Selling Price
            </Label>
            <Input
              id="newPhoneSellingPrice"
              name="selling_price"
              value={newPhoneData.selling_price}
              onChange={handleNewPhoneChange}
              className="col-span-3 bg-slate-700 border-slate-600 text-white"
              placeholder="Enter selling price"
            />
          </div>
          
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleAddPhone}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Add Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewPhoneDialog;
