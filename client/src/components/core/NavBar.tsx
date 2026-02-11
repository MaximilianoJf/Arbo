import { ArrowRightFromSquare, Gear, Persons } from "@gravity-ui/icons";
import { Avatar, Dropdown, Label, Link as HeroUILink } from "@heroui/react";
import { ThemeSwitcher } from "../widgets/ThemeSwitcher";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Logo } from "../ui";

export const NavBar = () => {

    const [user, setUser] = useState(false);

    return (
        <>
            <header className="relative z-10 flex-0">
                <nav className="flex justify-evenly p-1 items-center py-4">
                    <h1 className="flex items-end text-4xl">
                        <Link to="/"><Logo /></Link>
                    </h1>
                    <ul className="flex text-default-500 gap-3 space-x-3 items-center">
                        {!user ? (
                            <>
                                <li><HeroUILink><Link to="/register">Register</Link></HeroUILink></li>
                                <li><HeroUILink><Link to="/form-builder/create-form">Create Form</Link></HeroUILink></li>
                            </>
                        ) : (
                            <li>
                                <Dropdown>
                                    <Dropdown.Trigger className="rounded-full">
                                        <Avatar>
                                            <Avatar.Image
                                                alt="Junior Garcia"
                                                src="https://avatar.iran.liara.run/public/34"
                                            />
                                            <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
                                        </Avatar>
                                    </Dropdown.Trigger>
                                    <Dropdown.Popover>
                                        <div className="px-3 pt-3 pb-1">
                                            <div className="flex items-center gap-2">
                                                <Avatar size="sm">
                                                    <Avatar.Image
                                                        alt="Jane"
                                                        src="https://avatar.iran.liara.run/public/34"
                                                    />
                                                    <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
                                                </Avatar>
                                                <div className="flex flex-col gap-0">
                                                    <p className="text-sm leading-5 font-medium">Jane Doe</p>
                                                    <p className="text-xs leading-none text-muted">jane@example.com</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Dropdown.Menu>
                                            <Dropdown.Item id="dashboard" textValue="Dashboard">
                                                <Label>Dashboard</Label>
                                            </Dropdown.Item>
                                            <Dropdown.Item id="profile" textValue="Profile">
                                                <Label>Profile</Label>
                                            </Dropdown.Item>
                                            <Dropdown.Item id="settings" textValue="Settings">
                                                <div className="flex w-full items-center justify-between gap-2">
                                                    <Label>Settings</Label>
                                                    <Gear className="size-3.5 text-muted" />
                                                </div>
                                            </Dropdown.Item>
                                            <Dropdown.Item id="new-project" textValue="New project">
                                                <div className="flex w-full items-center justify-between gap-2">
                                                    <Label>Create Team</Label>
                                                    <Persons className="size-3.5 text-muted" />
                                                </div>
                                            </Dropdown.Item>
                                            <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                                                <div className="flex w-full items-center justify-between gap-2">
                                                    <Label>Log Out</Label>
                                                    <ArrowRightFromSquare className="size-3.5 text-danger" />
                                                </div>
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown.Popover>
                                </Dropdown>
                            </li>
                        )}
                        <li><ThemeSwitcher /></li>
                    </ul>

                </nav>
            </header >



        </>
    );
}