import * as React from 'react';
import {browserHistory, RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import isEqual from 'lodash/isEqual';

import {addErrorMessage, addSuccessMessage} from 'sentry/actionCreators/indicator';
import {fetchTeamDetails, joinTeam} from 'sentry/actionCreators/teams';
import {Client} from 'sentry/api';
import Alert from 'sentry/components/alert';
import Button from 'sentry/components/button';
import IdBadge from 'sentry/components/idBadge';
import ListLink from 'sentry/components/links/listLink';
import LoadingError from 'sentry/components/loadingError';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import NavTabs from 'sentry/components/navTabs';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {t, tct} from 'sentry/locale';
import TeamStore from 'sentry/stores/teamStore';
import {Organization, Team} from 'sentry/types';
import recreateRoute from 'sentry/utils/recreateRoute';
import withApi from 'sentry/utils/withApi';
import withOrganization from 'sentry/utils/withOrganization';
import withTeams from 'sentry/utils/withTeams';

type Props = {
  api: Client;
  teams: Team[];
  children: React.ReactNode;
  organization: Organization;
} & RouteComponentProps<{orgId: string; teamId: string}, {}>;

type State = {
  loading: boolean;
  error: boolean;
  requesting: boolean;
  team: Team | null;
};

class TeamDetails extends React.Component<Props, State> {
  state = this.getInitialState();

  getInitialState(): State {
    const team = TeamStore.getBySlug(this.props.params.teamId);

    return {
      loading: !TeamStore.initialized,
      error: false,
      requesting: false,
      team,
    };
  }

  componentDidUpdate(prevProps: Props) {
    const {params} = this.props;

    if (
      prevProps.params.teamId !== params.teamId ||
      prevProps.params.orgId !== params.orgId
    ) {
      this.fetchData();
    }
    if (!isEqual(this.props.teams, prevProps.teams)) {
      this.setActiveTeam();
    }
  }

  setActiveTeam() {
    const team = TeamStore.getBySlug(this.props.params.teamId);
    const loading = !TeamStore.initialized;
    const error = !loading && !team;

    this.setState({team, loading, error});
  }

  handleRequestAccess = () => {
    const {api, params} = this.props;
    const {team} = this.state;
    if (!team) {
      return;
    }

    this.setState({
      requesting: true,
    });

    joinTeam(
      api,
      {
        orgId: params.orgId,
        teamId: team.slug,
      },
      {
        success: () => {
          addSuccessMessage(
            tct('You have requested access to [team]', {
              team: `#${team.slug}`,
            })
          );
          this.setState({
            requesting: false,
          });
        },
        error: () => {
          addErrorMessage(
            tct('Unable to request access to [team]', {
              team: `#${team.slug}`,
            })
          );
          this.setState({
            requesting: false,
          });
        },
      }
    );
  };

  fetchData = () => {
    this.setState({
      loading: true,
      error: false,
    });
    fetchTeamDetails(this.props.api, this.props.params);
  };

  onTeamChange = (data: Team) => {
    const team = this.state.team;
    if (data.slug !== team?.slug) {
      const orgId = this.props.params.orgId;
      browserHistory.replace(`/organizations/${orgId}/teams/${data.slug}/settings/`);
    } else {
      this.setState({
        team: {
          ...team,
          ...data,
        },
      });
    }
  };

  render() {
    const {children, params, routes} = this.props;
    const {team, loading, requesting, error} = this.state;

    if (loading) {
      return <LoadingIndicator />;
    }
    if (!team || !team.hasAccess) {
      return (
        <Alert type="warning">
          {team ? (
            <RequestAccessWrapper>
              {tct('You do not have access to the [teamSlug] team.', {
                teamSlug: <strong>{`#${team.slug}`}</strong>,
              })}
              <Button
                disabled={requesting || team.isPending}
                size="small"
                onClick={this.handleRequestAccess}
              >
                {team.isPending ? t('Request Pending') : t('Request Access')}
              </Button>
            </RequestAccessWrapper>
          ) : (
            <div>{t('You do not have access to this team.')}</div>
          )}
        </Alert>
      );
    }
    if (error) {
      return <LoadingError onRetry={this.fetchData} />;
    }

    // `/organizations/${orgId}/teams/${teamId}`;
    const routePrefix = recreateRoute('', {routes, params, stepBack: -1});

    const navigationTabs = [
      <ListLink key={0} to={`${routePrefix}members/`}>
        {t('Members')}
      </ListLink>,
      <ListLink key={1} to={`${routePrefix}projects/`}>
        {t('Projects')}
      </ListLink>,
      <ListLink key={2} to={`${routePrefix}notifications/`}>
        {t('Notifications')}
      </ListLink>,
      <ListLink key={3} to={`${routePrefix}settings/`}>
        {t('Settings')}
      </ListLink>,
    ];

    return (
      <div>
        <SentryDocumentTitle title={t('Team Details')} orgSlug={params.orgId} />
        <h3>
          <IdBadge hideAvatar team={team} avatarSize={36} />
        </h3>

        <NavTabs underlined>{navigationTabs}</NavTabs>

        {React.isValidElement(children) &&
          React.cloneElement(children, {
            team,
            onTeamChange: this.onTeamChange,
          })}
      </div>
    );
  }
}

// TODO(davidenwang): change to functional component and replace withTeams with useTeams
export default withApi(withOrganization(withTeams(TeamDetails)));

const RequestAccessWrapper = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
