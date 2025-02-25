import React, { useState } from 'react';
import { clone, merge } from 'lodash';
import { css, cx, keyframes } from 'emotion';
import Draggable, { DraggableEvent, DraggableData, ControlPosition } from 'react-draggable';
import { stylesFactory } from '@grafana/ui';
import SensorType from './types/Sensor';
import MappingOperators from 'MappingOperators';
import { Mapping } from 'types/Mapping';
import { formattedValueToString, getValueFormat } from '@grafana/data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconName } from '@fortawesome/fontawesome-svg-core';

type Props = {
  sensor: SensorType;
  mappings: Mapping[];
  draggable: boolean;
  iconName: IconName;
  index: number;
  link: string;
  name: string;
  imageDimensions: {
    width: number;
    height: number;
  };
  onPositionChange: Function;
  value: any | undefined;
};

const pxToPerc = (px: number, size: number): number => {
  return (px * 100) / size;
};

const percToPx = (perc: number, size: number): number => {
  return (perc * size) / 100;
};

export const Sensor: React.FC<Props> = (props: Props) => {
  // const theme = useTheme();
  const { draggable, imageDimensions, onPositionChange, index, iconName, link, name, mappings } = props;
  let sensor = clone(props.sensor) as SensorType & Mapping['values'];
  let value = clone(props.value);

  const styles = getStyles();

  const [isMouseOver, setIsMouseOver] = useState(false);

  const onDragStop = (_event: DraggableEvent, data: DraggableData) => {
    const newPosition: SensorType['position'] = {
      x: pxToPerc(data.x, imageDimensions.width),
      y: pxToPerc(data.y, imageDimensions.height),
    };

    onPositionChange(newPosition, index);
  };

  const sensorPosition: ControlPosition = {
    x: percToPx(sensor.position.x, imageDimensions.width),
    y: percToPx(sensor.position.y, imageDimensions.height),
  };

  for (let mapping of mappings) {
    const mappingOperator = MappingOperators.find((mappingOperator) => mapping.operator === mappingOperator.id);

    // Apply mapping function if it satisfies requirements
    const isOverrode = mappingOperator?.function(value, mapping.compareTo);

    if (isOverrode) {
      sensor = merge(sensor, mapping.values);
      value = mapping.values.overrideValue ? mapping.values.overrideValue : value;

      delete sensor.overrideValue;
      // Stop at first valid mapping
      break;
    }
  }

  // Get and apply unit type formatter
  const { unit } = sensor;

  const valueFormatter = getValueFormat(unit);

  let formattedValueString;
  if (value !== undefined) {
    const formattedValue = valueFormatter(value, sensor.decimals);
    formattedValueString = formattedValueToString(formattedValue);
  } else {
    formattedValueString = 'No data';
  }

  return (
    <>
      {sensor.visible && (
        <Draggable
          disabled={draggable}
          bounds="#imageItBgImage"
          handle=".handle"
          onStop={onDragStop}
          position={sensorPosition}
        >
          <div
            className={cx(
              styles.container,
              css`
                color: ${sensor.fontColor};
                background-color: ${sensor.backgroundColor};
              `,
              sensor.backgroundBlink && styles.blink
            )}
            onMouseEnter={() => setIsMouseOver(true)}
            onMouseLeave={() => setIsMouseOver(false)}
          >
            <div className={cx(styles.content)}>
              <a
                className={css`
                  color: ${sensor.fontColor};
                `}
                href={link || '#'}
              >
                {iconName && <FontAwesomeIcon icon={iconName} />}
                <div className={cx(styles.name)}>{name}</div>
                <div className={cx(styles.value, sensor.valueBlink && styles.blink, sensor.bold && styles.bold)}>
                  {formattedValueString}
                </div>
              </a>
            </div>

            {!draggable && isMouseOver && (
              <div className={cx(styles.handle, 'handle')}>
                <div className="fa fa-bars" />
              </div>
            )}
          </div>
        </Draggable>
      )}
    </>
  );
};

const blink = keyframes`
  50% {
    opacity: 0;
  }
`;

const getStyles = stylesFactory(() => {
  return {
    container: css`
      position: absolute;
      padding: 0.5em;
    `,
    handle: css`
      float: right;
      margin-left: 0.5em;
    `,
    content: css`
      float: left;
    `,
    name: css`
      font-size: 0.5em;
    `,
    value: css``,
    blink: css`
      animation: ${blink} 1s linear infinite;
    `,
    bold: css`
      font-weight: bold;
    `,
  };
});
