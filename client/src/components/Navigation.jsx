import 'bootstrap-icons/font/bootstrap-icons.css';

import { Navbar, Nav, Form } from 'react-bootstrap';

import { LoginButton, LogoutButton } from './Auth';

const Navigation = (props) => {

    return (
        <Navbar bg="primary" expand="md" variant="dark" className="navbar-padding">
            <Navbar.Brand className="mx-2">
                <i className="bi bi-collection-play mx-2" />
                Cloud Service
            </Navbar.Brand>
            <Nav>
                <Navbar.Text className="mx-2 fs-5">
                    {props.user && props.user.name && 
                    `Logged in ${props.loggedInTotp ? '(2FA)' : ''} as: ${props.user.name}`}
                </Navbar.Text>
                <Form className="mx-2 ms-auto">
                    {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
                </Form>
            </Nav>
        </Navbar>
    );
}

export { Navigation };
