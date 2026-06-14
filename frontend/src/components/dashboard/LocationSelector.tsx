import { LocationSummary } from "../../types/measurement";
import { Select } from "../ui/Select";

export function LocationSelector({ locations, value, onChange }: { locations: LocationSummary[]; value: string; onChange: (value: string) => void }) {
  return (
    <Select
      label="Ubicacion"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={locations.map((location) => ({ label: `${location.location_name}${location.city ? ` - ${location.city}` : ""}`, value: location.location_name }))}
    />
  );
}
