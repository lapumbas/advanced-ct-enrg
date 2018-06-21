(() => {
  window.burgerButton = () => {
    let burger = document.querySelector('.header__burger');
    let headerNavigation = document.querySelector('.header__navigation');
    let burgerImg = burger.querySelector('img');
    burger.classList.remove('no-js')
    headerNavigation.classList.remove('no-js')
    burger.addEventListener('click', () => {
      if (!headerNavigation.classList.contains('header__navigation--active')) {
        headerNavigation.classList.add('header__navigation--active');
        burgerImg.src = '../img/min/vector/m-close.svg'
      } else {
        headerNavigation.classList.remove('header__navigation--active');
        burgerImg.src = '../img/min/vector/mobile-menu.svg'
      }
    })
  }
})();
