import { css } from '@emotion/css';
import Map from 'ol/Map';
import { Geometry, LineString, Point } from 'ol/geom';
import { Draw, Modify } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { getArea, getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style, Text } from 'ol/style';
import React, { useMemo, useState } from 'react';
import tinycolor from 'tinycolor2';

import { formattedValueToString, GrafanaTheme } from '@grafana/data';
import { IconButton, RadioButtonGroup, Select, stylesFactory } from '@grafana/ui';
import { config } from 'app/core/config';

import { MapMeasureOptions, measures } from '../utils/measure';

type Props = {
  map: Map;
  menuActiveState: (value: boolean) => void;
};

export const MeasureOverlay = ({ map, menuActiveState }: Props) => {
  const measureStyle = getStyles(config.theme);

  // Menu State Management
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const [menuActive, setMenuActive] = useState<boolean>(false);

  // Options State
  const [options, setOptions] = useState<MapMeasureOptions>({
    action: measures[0].value!,
    unit: measures[0].units[0].value!,
  });
  const unit = useMemo(() => {
    const action = measures.find((m) => m.value === options.action) ?? measures[0];
    const current = action.getUnit(options.unit);
    const fn = action.value === 'area' ? getArea : getLength;
    const measure = (geo: Geometry) => {
      const v = fn(geo);
      return formattedValueToString(current.format(v));
    };
    return {
      current,
      options: action.units,
      measure,
    };
  }, [options]);

  const clearPrevious = true;
  const showSegments = false;

  function toggleMenu() {
    setMenuActive(!menuActive);
    // Lift menu state
    // TODO: consolidate into one state
    menuActiveState(!menuActive);
    if (menuActive) {
      map.removeInteraction(draw);
      vector.set('visible', false);
    } else {
      if (firstLoad) {
        // Initialize on first load
        setFirstLoad(false);
        map.addLayer(vector);
        map.addInteraction(modify);
      }
      vector.set('visible', true);
      map.removeInteraction(draw); // Remove last interaction
      const a = measures.find((v) => v.value === options.action) ?? measures[0];
      addInteraction(map, a.geometry, showSegments, clearPrevious);
    }
  }

  return (
    <div className={`${measureStyle.infoWrap} ol-unselectable ol-control`} style={{ backgroundColor: '#22252b' }}>
      <IconButton
        name="ruler-combined"
        style={{ backgroundColor: 'rgba(204, 204, 220, 0.16)', display: 'inline-block', marginRight: '5px' }}
        tooltip={`${menuActive ? 'hide' : 'show'} measure tools`}
        tooltipPlacement="right"
        onClick={() => {
          toggleMenu();
        }}
      />
      {menuActive ? (
        <>
          <IconButton
            name="angle-left"
            style={{ float: 'right' }}
            tooltip="hide measure tools"
            tooltipPlacement="right"
            onClick={() => {
              toggleMenu();
            }}
          />
          <RadioButtonGroup
            value={options.action}
            options={measures}
            size="sm"
            onChange={(e) => {
              map.removeInteraction(draw);
              const m = measures.find((v) => v.value === e) ?? measures[0];
              const unit = m.getUnit(options.unit);
              setOptions({ ...options, action: m.value!, unit: unit.value! });
              addInteraction(map, m.geometry, showSegments, clearPrevious);
            }}
          />
          <Select
            value={unit.current}
            options={unit.options}
            onChange={(v) => {
              const a = measures.find((v) => v.value === options.action) ?? measures[0];
              const unit = a.getUnit(v.value) ?? a.units[0];
              setOptions({ ...options, unit: unit.value! });
            }}
          />
        </>
      ) : null}
    </div>
  );
};

// Open Layer styles
const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
  }),
});

const labelStyle = new Style({
  text: new Text({
    font: '14px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [3, 3, 3, 3],
    textBaseline: 'bottom',
    offsetY: -15,
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
  }),
});

const tipStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const modifyStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
  text: new Text({
    text: 'Drag to modify',
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const segmentStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textBaseline: 'bottom',
    offsetY: -12,
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
});

const segmentStyles = [segmentStyle];
const source = new VectorSource();
const vector = new VectorLayer({
  source: source,
  style: function (feature) {
    return styleFunction(feature, false);
  },
  visible: true,
});

type measureFn = (geo: Geometry) => string;

const modify = new Modify({ source: source, style: modifyStyle });
let tipPoint: Geometry;
let draw: Draw; // global so we can remove it later

// TODO: reconcile Feature type in open layers
// eslint-disable-next-line
function styleFunction(measure: measureFn, feature: any, segments: boolean, drawType?: string, tip?: string) {
  const styles = [style];
  const geometry = feature.getGeometry();
  if (geometry) {
    const type = geometry.getType();
    let point, label, line;
    if (!drawType || drawType === type) {
      if (type === 'Polygon') {
        point = geometry.getInteriorPoint();
        label = measure(geometry);
        line = new LineString(geometry.getCoordinates()[0]);
      } else if (type === 'LineString') {
        point = new Point(geometry.getLastCoordinate());
        label = measure(geometry);
        line = geometry;
      }
    }
    if (segments && line) {
      let count = 0;
      line.forEachSegment(function (a: number, b: number) {
        const segment = new LineString([a, b]);
        const label = measure(segment);
        if (segmentStyles.length - 1 < count) {
          segmentStyles.push(segmentStyle.clone());
        }
        const segmentPoint = new Point(segment.getCoordinateAt(0.5));
        segmentStyles[count].setGeometry(segmentPoint);
        segmentStyles[count].getText().setText(label);
        styles.push(segmentStyles[count]);
        count++;
      });
    }
    if (label) {
      labelStyle.setGeometry(point);
      labelStyle.getText().setText(label);
      styles.push(labelStyle);
    }
    if (tip && type === 'Point' && !modify.getOverlay().getSource().getFeatures().length) {
      tipPoint = geometry;
      tipStyle.getText().setText(tip);
      styles.push(tipStyle);
    }
  }

  return styles;
}

function addInteraction(map: Map, typeSelect: string, showSegments: boolean, clearPrevious: boolean) {
  const drawType = typeSelect;
  const activeTip =
    ' Click to continue ' + (drawType === 'Polygon' ? 'polygon' : 'line') + ' \n (double-click to end) ';
  const idleTip = ' Click to start ';
  let tip = idleTip;
  draw = new Draw({
    source: source,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments, drawType, tip);
    },
  });
  draw.on('drawstart', function () {
    if (clearPrevious) {
      source.clear();
    }
    modify.setActive(false);
    tip = activeTip;
  });
  draw.on('drawend', function () {
    modifyStyle.setGeometry(tipPoint);
    modify.setActive(true);
    map.once('pointermove', function () {
      modifyStyle.setGeometry('');
    });
    tip = idleTip;
  });
  modify.setActive(true);
  map.addInteraction(draw);
}

const getStyles = stylesFactory((theme: GrafanaTheme) => ({
  infoWrap: css`
    color: ${theme.colors.text};
    background: ${tinycolor(theme.colors.panelBg).setAlpha(0.7).toString()};
    border-radius: 2px;
    padding: 8px;
  `,
}));
