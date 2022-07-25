import { Geometry } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';

import { FormattedValue, formattedValueToString, getValueFormat, SelectableValue, toFixedUnit } from '@grafana/data';

type MeasureAction = 'area' | 'length';

export interface MapMeasureOptions {
  action: MeasureAction;
  unit: string;
  color?: string;
}

export function getMapMeasurement(opts: MapMeasureOptions, geo: Geometry): string {
  let v = 0;
  let action = measures[0];
  if (opts.action === 'area') {
    action = measures[1];
    v = getArea(geo);
  } else {
    v = getLength(geo);
  }
  return formattedValueToString(action.getUnit(opts.unit).format(v));
}

export interface MapMeasure extends SelectableValue<MeasureAction> {
  geometry: 'Polygon' | 'LineString';
  units: MapUnit[];

  /**
   * This will get the best unit for the selected string or a default
   * This is helpful when converting from area<>length, we should try to stay
   * in the same category of unit if possible
   */
  getUnit: (v?: string) => MapUnit;
}

export interface MapUnit extends SelectableValue<string> {
  format: (si: number) => FormattedValue;
}

export const measures: MapMeasure[] = [
  {
    value: 'length',
    label: 'Length',
    geometry: 'LineString',
    units: [
      // { name: 'millimeter (mm)', id: 'lengthmm', fn: SIPrefix('m', -1) },
      // { name: 'inch (in)', id: 'lengthin', fn: toFixedUnit('in') },
      // { name: 'feet (ft)', id: 'lengthft', fn: toFixedUnit('ft') },
      // { name: 'meter (m)', id: 'lengthm', fn: SIPrefix('m') },
      // { name: 'kilometer (km)', id: 'lengthkm', fn: SIPrefix('m', 1) },
      // { name: 'mile (mi)', id: 'lengthmi', fn: toFixedUnit('mi') },
      { value: 'm', label: 'Metric (m/km)', format: (m: number) => getValueFormat('lengthm')(m) },
      { value: 'f', label: 'Feet (ft)', format: (m: number) => getValueFormat('lengthft')(m * 3.28084) },
      { value: 'mi', label: 'Mile (mi)', format: (m: number) => getValueFormat('lengthmi')(m / 1609.0) },
      { value: 'nmi', label: 'Nautical mile (mi)', format: (m: number) => getValueFormat('nmi')(m / 1852.0) },
    ],
    getUnit: (v?: string) => {
      const units = measures[1].units;
      if (v?.endsWith('2')) {
        v = v.substring(0, v.length - 2);
      }
      return units.find((u) => u.value === v) ?? units[0];
    },
  },
  {
    value: 'area',
    label: 'Area',
    geometry: 'Polygon',
    units: [
      // { name: 'Square Meters (m²)', id: 'areaM2', fn: toFixedUnit('m²') },
      // { name: 'Square Feet (ft²)', id: 'areaF2', fn: toFixedUnit('ft²') },
      // { name: 'Square Miles (mi²)', id: 'areaMI2', fn: toFixedUnit('mi²') },

      { value: 'm2', label: 'Square Meters (m²)', format: (m2: number) => getValueFormat('areaM2')(m2) },
      { value: 'f2', label: 'Square Feet (ft²)', format: (m2: number) => getValueFormat('areaF2')(m2 * 10.76391) },
      { value: 'mi2', label: 'Square Miles (mi²)', format: (m2: number) => getValueFormat('areaMI2')(m2 * 3.861e-7) },
      { value: 'acre', label: 'Acres', format: (m2: number) => toFixedUnit('acre')(m2 * 0.000247105) },
      { value: 'hectare', label: 'Hectare', format: (m2: number) => toFixedUnit('acre')(m2 * 1e-4) },
    ],
    getUnit: (v?: string) => {
      const units = measures[0].units;
      if (!v?.endsWith('2')) {
        v += '2';
      }
      return units.find((u) => u.value === v) ?? units[0];
    },
  },
];
