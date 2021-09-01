import React, {FunctionComponent, ReactNode} from 'react';
import {InjectedRouter, withRouter} from 'react-router';
import styled from '@emotion/styled';

import ErrorPanel from 'app/components/charts/errorPanel';
import {EventsRequestProps} from 'app/components/charts/eventsRequest';
import {HeaderTitleLegend} from 'app/components/charts/styles';
import Placeholder from 'app/components/placeholder';
import QuestionTooltip from 'app/components/questionTooltip';
import {IconWarning} from 'app/icons/iconWarning';
import space from 'app/styles/space';
import {Series} from 'app/types/echarts';
import {HistogramChildren} from 'app/utils/performance/histogram/histogramQuery';
import {DataFilter} from 'app/utils/performance/histogram/types';
import DurationChart from 'app/views/performance/charts/chart';
import getPerformanceWidgetContainer, {
  PerformanceWidgetContainerTypes,
} from 'app/views/performance/landing/widgets/components/performanceWidgetContainer';

import {ChartDataProps} from '../chart/histogramChart';

export enum GenericPerformanceWidgetDataType {
  histogram = 'histogram',
  area = 'area',
}

type HeaderProps = {
  title: string;
  titleTooltip: string;
};

type BaseProps = {
  chartField: string;
  chartHeight: number;
  dataType: GenericPerformanceWidgetDataType;
  containerType: PerformanceWidgetContainerTypes;
  HeaderActions?: FunctionComponent<ChartDataProps>;
} & HeaderProps;

type HistogramWidgetProps = BaseProps & {
  dataType: GenericPerformanceWidgetDataType.histogram;
  Query: FunctionComponent<
    HistogramChildren & {fields: string[]; dataFilter?: DataFilter}
  >;
  Chart: FunctionComponent<ChartDataProps & {chartHeight: number}>;
};

type AreaWidgetProps = BaseProps & {
  dataType: GenericPerformanceWidgetDataType.area;
  Query: FunctionComponent<Pick<EventsRequestProps, 'children' | 'yAxis'>>;
  Chart: FunctionComponent<React.ComponentProps<typeof DurationChart>>;
};

function DataStateSwitch(props: {
  loading: boolean;
  errored: boolean;
  hasData: boolean;

  loadingComponent?: JSX.Element;
  errorComponent: JSX.Element;
  chartComponent: JSX.Element;
  emptyComponent: JSX.Element;
}): JSX.Element {
  if (props.loading && props.loadingComponent) {
    return props.loadingComponent;
  }
  if (props.errored) {
    return props.errorComponent;
  }
  if (!props.hasData) {
    return props.emptyComponent;
  }
  return props.chartComponent;
}

// TODO(k-fish): Remove hardcoding the grid once all the charts are in
const grid = {
  left: space(3),
  right: space(3),
  top: '25px',
  bottom: '0px',
};

function WidgetHeader(props: HeaderProps & {renderedActions: ReactNode}) {
  const {title, titleTooltip, renderedActions} = props;
  return (
    <WidgetHeaderContainer>
      <div>
        <HeaderTitleLegend>
          {title}
          <QuestionTooltip position="top" size="sm" title={titleTooltip} />
        </HeaderTitleLegend>
      </div>

      {renderedActions && (
        <HeaderActionsContainer>{renderedActions}</HeaderActionsContainer>
      )}
    </WidgetHeaderContainer>
  );
}

const WidgetHeaderContainer = styled('div')``;
const HeaderActionsContainer = styled('div')``;

type WidgetPropUnion = HistogramWidgetProps | AreaWidgetProps;

export function GenericPerformanceWidget(props: WidgetPropUnion) {
  switch (props.dataType) {
    case GenericPerformanceWidgetDataType.area:
      return <AreaWidget {...props} />;
    case GenericPerformanceWidgetDataType.histogram:
      return <HistogramWidget {...props} />;
    default:
      throw new Error('Missing support for data type');
  }
}

function _AreaWidget(props: AreaWidgetProps & {router: InjectedRouter}) {
  const {chartField, Query, Chart, HeaderActions, chartHeight, router, containerType} =
    props;
  return (
    <Query yAxis={[chartField]}>
      {results => {
        const loading = results.loading;
        const errored = results.errored;
        const data: Series[] = results.timeseriesData as Series[];

        const start = null;

        const end = null;
        const utc = false;
        const statsPeriod = '14d';

        const Container = getPerformanceWidgetContainer({
          containerType,
        });

        const childData = {
          loading,
          errored,
          data,
          start,
          end,
          utc,
          statsPeriod,
          router,
          field: chartField,
        };

        return (
          <Container>
            <WidgetHeader
              {...props}
              renderedActions={
                HeaderActions && <HeaderActions grid={grid} {...childData} />
              }
            />
            <DataStateSwitch
              {...childData}
              hasData={!!(data && data.length)}
              errorComponent={<DefaultErrorComponent chartHeight={chartHeight} />}
              chartComponent={<Chart {...childData} grid={grid} height={chartHeight} />}
              emptyComponent={<Placeholder height={`${chartHeight}px`} />}
            />
          </Container>
        );
      }}
    </Query>
  );
}
const AreaWidget = withRouter(_AreaWidget);

function HistogramWidget(props: HistogramWidgetProps) {
  const {chartField, Query, Chart, HeaderActions, chartHeight, containerType} = props;
  return (
    <Query fields={[chartField]} dataFilter="exclude_outliers">
      {results => {
        const loading = results.isLoading;
        const errored = results.error !== null;
        const chartData = results.histograms?.[chartField];

        const Container = getPerformanceWidgetContainer({
          containerType,
        });

        const childData = {
          loading,
          errored,
          chartData,
          field: chartField,
        };

        return (
          <Container>
            <WidgetHeader
              {...props}
              renderedActions={
                HeaderActions && <HeaderActions grid={grid} {...childData} />
              }
            />
            <DataStateSwitch
              {...childData}
              hasData={!!(chartData && chartData.length)}
              errorComponent={<DefaultErrorComponent chartHeight={chartHeight} />}
              chartComponent={
                <Chart {...childData} grid={grid} chartHeight={chartHeight} />
              }
              emptyComponent={<Placeholder height={`${chartHeight}px`} />}
            />
          </Container>
        );
      }}
    </Query>
  );
}

const DefaultErrorComponent = (props: {chartHeight: number}) => {
  return (
    <ErrorPanel height={`${props.chartHeight}px`}>
      <IconWarning color="gray300" size="lg" />
    </ErrorPanel>
  );
};

GenericPerformanceWidget.defaultProps = {
  containerType: 'panel',
  chartHeight: 200,
};
