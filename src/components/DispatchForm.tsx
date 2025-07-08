import { useEffect, useMemo, useState } from "react";
import { DispatchFormData, FormErrors } from "@/types";
import BundleInputs from "./dispatch/BundleInputs";
import { DestinationSelector } from "./dispatch/DestinationSelector";
import ItemSelector from "./dispatch/ItemSelector";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DispatchDestination } from "@/lib/constants";
import BothDestinationDialog from "./dispatch/BothDestinationDialog";
import GrandTotalRow from "./dispatch/GrandTotalRow";
import { getGodownStaff } from "@/lib/utils";

const defaultFormData: DispatchFormData = {
  destination: "",
  itemType: "",
  shirt_bundle_count: "",
  pant_bundle_count: "",
  pant_bundles: [],
  shirt_bundles: [],
};

const DispatchForm = () => {
  const [formData, setFormData] = useState<DispatchFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showDialog, setShowDialog] = useState(false);

  const godownStaff = useMemo(() => getGodownStaff(), []);

  const safeParse = (value: string): number => parseInt(value) || 0;
  const totalBundles =
    safeParse(formData.shirt_bundle_count) + safeParse(formData.pant_bundle_count);

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.destination) errors.destination = "Destination is required";
    if (!formData.itemType) errors.itemType = "Item type is required";

    const total = totalBundles;
    if (total === 0) {
      toast.error("Total quantity cannot be zero");
      return null;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0 ? total : null;
  };

  const handleSubmit = () => {
    const total = validateForm();
    if (total === null) return;

    if (formData.destination === DispatchDestination.BOTH) {
      setShowDialog(true);
    } else {
      toast.success("Form submitted successfully");
      console.log("Final form data:", formData);
      setFormData(defaultFormData);
    }
  };

  useEffect(() => {
    setFormErrors({});
  }, [formData.destination, formData.itemType]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold">Goods Dispatch Form</h2>

      <DestinationSelector
        destination={formData.destination}
        onChange={(value) => setFormData({ ...formData, destination: value })}
        error={formErrors.destination}
      />

      <ItemSelector
        itemType={formData.itemType}
        onChange={(value) => setFormData({ ...formData, itemType: value })}
        error={formErrors.itemType}
      />

      <BundleInputs formData={formData} setFormData={setFormData} />

      {/* ✅ Total Bundles Displayed */}
      <div className="text-md font-medium text-gray-800 px-1">
        Total Bundles: <span className="font-semibold">{totalBundles}</span>
      </div>

      <GrandTotalRow formData={formData} />

      <Button className="w-full mt-4" onClick={handleSubmit}>
        Submit
      </Button>

      <BothDestinationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        formData={formData}
        godownStaff={godownStaff}
        onSubmitSuccess={() => {
          setFormData(defaultFormData);
          setShowDialog(false);
        }}
      />
    </div>
  );
};

export default DispatchForm;
