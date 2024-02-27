"use client";
import React from 'react'
import Link from 'next/link'
import { navLinks } from '@/constants'
import { usePathname } from 'next/navigation'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
  } from "@/components/ui/sheet"
import Image from 'next/image'
import { SignedIn,SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '../ui/button';
  
const MobileNav = () => {
    const pathname=usePathname()
  return (
    <header className="header">
        <Link href='/' className='flex items-center gap-2 md:py-2'>
            <Image src='/assets/images/logo.png' alt='logo' width={70} height={20}/>
        </Link>
        <nav className="flex gap-2">
            <SignedIn>
                <UserButton afterSignOutUrl='/' />
                <Sheet>
                    <SheetTrigger>
                        <Image src='/assets/icons/menu.svg' alt='menu' height={32} width={32} className='cursor-pointer'/>
                    </SheetTrigger>
                  
                    <SheetContent className='sheet-content sm:w-64'>
                        <>
                            <Image src='/assets/images/logo.png' alt='logo' width={70} height={20}/>
                            <ul className='header-nav_elements'>
                          {navLinks.map(link=>{
                            const isActive=link.route===pathname
                            return (
                                <li key={link.route} className={` p-18 group  text-gray-700 ${isActive && 'gradient-text'}`}>{
                                    <Link className='sidebar-link' href={link.route}>
                                        <Image src={link.icon} alt='logo' width={24} height={24} />
                                        {link.label}
                                    </Link>
                                }</li>
                                    )
                            })}
                            </ul>
                        
                        </>
                    </SheetContent>
                </Sheet>

            </SignedIn>
            <SignedOut>
                    <Button asChild className='button bg-sky-700 bg-cover'>
                        <Link  href='sign-in'>Login</Link>
                    </Button>
                </SignedOut>
        </nav>
    </header>
    
  )
}

export default MobileNav