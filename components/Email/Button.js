import { Button } from 'react-bootstrap';
import styles from '../styles/buttonStyles.module.css';

export function SendReminder({
  setToastMessage,
  setShowToast,
  emailRecipient,
  emailSent,
}) {
  if (emailSent) {
    return <div> Email has already been sent!</div>;
  } else {
    return (
      <>
        <Button
          className={`${styles.emailButton}`}
          onClick={() => {
            setShowToast(true);
            setToastMessage(`Email has been sent to ${emailRecipient}`);
          }}
        >
          test
        </Button>
      </>
    );
  }
}
