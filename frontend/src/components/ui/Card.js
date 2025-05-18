import { Card as BootstrapCard } from "react-bootstrap";

function Card({ children, className = "" }) {
  return <BootstrapCard className={className}>{children}</BootstrapCard>;
}

Card.Header = function CardHeader({ children, className = "" }) {
  return (
    <BootstrapCard.Header className={className}>
      {children}
    </BootstrapCard.Header>
  );
};

Card.Body = function CardBody({ children, className = "" }) {
  return (
    <BootstrapCard.Body className={className}>{children}</BootstrapCard.Body>
  );
};

Card.Footer = function CardFooter({ children, className = "" }) {
  return (
    <BootstrapCard.Footer className={className}>
      {children}
    </BootstrapCard.Footer>
  );
};

export default Card;
