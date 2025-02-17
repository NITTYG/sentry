import * as React from 'react';

import {ModalRenderProps} from 'sentry/actionCreators/modal';
import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import {t} from 'sentry/locale';

type Props = {
  onSave: () => void;
  title: string;
  content: React.ReactElement;
  disabled: boolean;
} & ModalRenderProps;

const Modal = ({
  title,
  onSave,
  content,
  disabled,
  Header,
  Body,
  Footer,
  closeModal,
}: Props) => (
  <React.Fragment>
    <Header closeButton>{title}</Header>
    <Body>{content}</Body>
    <Footer>
      <ButtonBar gap={1.5}>
        <Button onClick={closeModal}>{t('Cancel')}</Button>
        <Button onClick={onSave} disabled={disabled} priority="primary">
          {t('Save Rule')}
        </Button>
      </ButtonBar>
    </Footer>
  </React.Fragment>
);

export default Modal;
