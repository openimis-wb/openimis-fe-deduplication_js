import * as React from 'react';
import { SelectInput } from '@openimis/fe-core';

// A select over fixed values with a leading "any" entry; choosing it clears the filter.
function FilterSelect({
  label, value, values, optionLabel, anyLabel, onChange, name,
}) {
  const options = [
    { value: null, label: anyLabel },
    ...values.map((v) => ({ value: v, label: optionLabel(v) })),
  ];
  return (
    <SelectInput
      module="deduplication"
      strLabel={label}
      name={name}
      options={options}
      value={value ?? null}
      onChange={(v) => onChange(v === '' ? null : v)}
    />
  );
}

export default FilterSelect;
