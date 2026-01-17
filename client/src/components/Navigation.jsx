import 'bootstrap-icons/font/bootstrap-icons.css';
import { Navbar, Nav, Form, Container } from 'react-bootstrap';
import { LoginButton, LogoutButton } from './Auth';

const Navigation = (props) => {
    return (
        <Navbar bg="primary" expand="md" variant="dark" className="px-3">
            <Container fluid className="p-0">
                <Navbar.Brand>
                    <i className="bi bi-cloud mx-2" />
                    Cloud Service
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="navbar-nav" />
                <Navbar.Collapse id="navbar-nav">
                    <Nav className="ms-auto">
                        <Navbar.Text className="me-3 fs-5">
                            {props.user && props.user.name && 
                                `Logged in ${props.loggedInTotp ? '(2FA)' : ''} as: ${props.user.name}`
                            }
                        </Navbar.Text>
                        <Form>
                            {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
                        </Form>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export { Navigation };
