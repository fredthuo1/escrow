import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar">
            <NavLink to="/" className={({ isActive }) => isActive ? "navbar-brand active" : "navbar-brand"}><h2>Escrow Account</h2></NavLink>
            <div className="navbar-links">
                <NavLink to="/sign-up" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Signup</NavLink>
                <NavLink to="/login" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Login</NavLink>
            </div>
        </nav>
    );
}

export default Navbar;