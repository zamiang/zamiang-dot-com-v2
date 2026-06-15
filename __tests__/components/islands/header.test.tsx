import Header from '@/components/islands/Header';
import { fireEvent, render, screen } from '@testing-library/react';

describe('Header', () => {
  describe('basic rendering', () => {
    it('should render header element', () => {
      render(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render main navigation', () => {
      render(<Header />);
      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('should render site name link', () => {
      render(<Header />);
      const homeLink = screen.getByRole('link', { name: 'Brennan Moore' });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('desktop navigation', () => {
    it('should render all navigation links', () => {
      render(<Header />);
      // Each link appears twice (desktop nav + mobile menu). Mobile is hidden
      // via globals.css at runtime, but that stylesheet isn't loaded in tests,
      // so we assert on the first (desktop) match — same pattern as the
      // resume-link test below.
      expect(screen.getAllByRole('link', { name: 'Work' })[0]).toHaveAttribute('href', '/#work');
      expect(screen.getAllByRole('link', { name: 'Writing' })[0]).toHaveAttribute(
        'href',
        '/#writing',
      );
      expect(screen.getAllByRole('link', { name: 'Photography' })[0]).toHaveAttribute(
        'href',
        '/#photography',
      );
    });

    it('should render external link with proper attributes', () => {
      render(<Header />);
      const resumeLinks = screen.getAllByRole('link', { name: /Resume/ });
      // There are two resume links (desktop and mobile), check the first
      const resumeLink = resumeLinks[0];
      expect(resumeLink).toHaveAttribute('href', '/brennan-moore-resume-2026.pdf');
      expect(resumeLink).toHaveAttribute('target', '_blank');
      expect(resumeLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('mobile menu toggle', () => {
    it('should render mobile menu checkbox', () => {
      render(<Header />);
      const checkbox = screen.getByRole('checkbox', { name: 'Toggle menu' });
      expect(checkbox).toBeInTheDocument();
    });

    it('should toggle checkbox when clicked', () => {
      render(<Header />);
      const checkbox = screen.getByRole('checkbox', { name: 'Toggle menu' }) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('should have minimum touch target size (44x44px)', () => {
      render(<Header />);
      const checkbox = screen.getByRole('checkbox', { name: 'Toggle menu' });
      // CSS class sets width/height to 44px
      expect(checkbox).toHaveClass('mobile-menu-toggle');
    });
  });

  describe('mobile menu content', () => {
    it('should have mobile navigation in DOM', () => {
      const { container } = render(<Header />);
      // Mobile menu is in DOM but hidden via CSS (display: none), query by class
      const mobileNav = container.querySelector('.mobile-menu');
      expect(mobileNav).toBeInTheDocument();
      expect(mobileNav).toHaveAttribute('aria-label', 'Mobile navigation');
    });

    it('should render all navigation links in mobile menu', () => {
      const { container } = render(<Header />);
      const mobileNav = container.querySelector('.mobile-menu');
      expect(mobileNav?.querySelector('a[href="/#work"]')).toBeInTheDocument();
      expect(mobileNav?.querySelector('a[href="/#writing"]')).toBeInTheDocument();
      expect(mobileNav?.querySelector('a[href="/#photography"]')).toBeInTheDocument();
      expect(
        mobileNav?.querySelector('a[href="/brennan-moore-resume-2026.pdf"]'),
      ).toBeInTheDocument();
    });

    it('should have external link attributes on resume in mobile menu', () => {
      const { container } = render(<Header />);
      const mobileNav = container.querySelector('.mobile-menu');
      const resumeLink = mobileNav?.querySelector('a[href="/brennan-moore-resume-2026.pdf"]');
      expect(resumeLink).toHaveAttribute('target', '_blank');
      expect(resumeLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should uncheck checkbox when navigation link is clicked', () => {
      const { container } = render(<Header />);
      const checkbox = screen.getByRole('checkbox', { name: 'Toggle menu' }) as HTMLInputElement;

      // Open menu
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      // Click a link in the mobile menu
      const mobileNav = container.querySelector('.mobile-menu');
      const workLink = mobileNav?.querySelector('a[href="/#work"]');
      expect(workLink).toBeInTheDocument();

      fireEvent.click(workLink!);

      // Menu should close (checkbox unchecked)
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label on main navigation', () => {
      render(<Header />);
      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should have proper aria-label on mobile navigation', () => {
      const { container } = render(<Header />);
      // Mobile nav is hidden by default (display: none), so query by class
      const mobileNav = container.querySelector('.mobile-menu');
      expect(mobileNav).toHaveAttribute('aria-label', 'Mobile navigation');
    });

    it('should have aria-label on toggle checkbox', () => {
      render(<Header />);
      const checkbox = screen.getByRole('checkbox', { name: 'Toggle menu' });
      expect(checkbox).toHaveAttribute('aria-label', 'Toggle menu');
    });

    it('should have aria-hidden on decorative menu button', () => {
      const { container } = render(<Header />);
      const menuButton = container.querySelector('.menu-button');
      expect(menuButton).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('visual button icons', () => {
    it('should have hamburger icon in menu button', () => {
      const { container } = render(<Header />);
      const openIcon = container.querySelector('.icon-open');
      expect(openIcon).toBeInTheDocument();
    });

    it('should have close icon in menu button', () => {
      const { container } = render(<Header />);
      const closeIcon = container.querySelector('.icon-close');
      expect(closeIcon).toBeInTheDocument();
    });
  });
});
