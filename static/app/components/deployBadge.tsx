import Link from 'sentry/components/links/link';
import Tag from 'sentry/components/tag';
import {IconOpen} from 'sentry/icons';
import {t} from 'sentry/locale';
import {Deploy} from 'sentry/types';
import {MutableSearch} from 'sentry/utils/tokenizeSearch';

type Props = {
  deploy: Deploy;
  projectId?: number;
  orgSlug?: string;
  version?: string;
  className?: string;
};

const DeployBadge = ({deploy, orgSlug, projectId, version, className}: Props) => {
  const shouldLinkToIssues = !!orgSlug && !!version;

  const badge = (
    <Tag
      className={className}
      type="highlight"
      icon={shouldLinkToIssues && <IconOpen />}
      textMaxWidth={80}
      tooltipText={shouldLinkToIssues ? t('Open In Issues') : undefined}
    >
      {deploy.environment}
    </Tag>
  );

  if (!shouldLinkToIssues) {
    return badge;
  }

  return (
    <Link
      to={{
        pathname: `/organizations/${orgSlug}/issues/`,
        query: {
          project: projectId ?? null,
          environment: deploy.environment,
          query: new MutableSearch([`release:${version!}`]).formatString(),
        },
      }}
    >
      {badge}
    </Link>
  );
};

export default DeployBadge;
