$(document).ready(function() {

  // Contact Form Handler
  let contactForm = $('.contact-form');
  let contactFormMethod = contactForm.attr('method');
  let contactFormEndpoint = contactForm.attr('action');

  function displaySubmitting(submitBtn, defaultText, doSubmit) {
    if (doSubmit) {
      submitBtn.addClass('disabled');
      submitBtn.html('<i class="fa fa-spin fa-spinner"></i> Sending...')
    } else {
      submitBtn.removeClass('disabled');
      submitBtn.html(defaultText);
    }
  }


  contactForm.submit(function(event) {
    event.preventDefault();
    let contactFormData = contactForm.serialize();
    let contactFormSubmitBtn = contactForm.find('[type="submit"]');
    let contactFormSubmitBtnTxt = contactFormSubmitBtn.text();

    let thisForm = $(this);
    displaySubmitting(contactFormSubmitBtn, '', true);
    $.ajax({
      method: contactFormMethod,
      url: contactFormEndpoint,
      data: contactFormData,
      success: function(data) {
        thisForm[0].reset();
        $.alert({
          title: 'Success',
          content: data.message,
          theme: 'modern'
        });
        setTimeout(function() {
          displaySubmitting(contactFormSubmitBtn, contactFormSubmitBtnTxt, false);
        }, 500);
      },
      error: function(error) {
        let jsonData = error.responseJSON;
        console.log(jsonData);
        let msg = '';
        $.each(jsonData, function(key, value) {
          msg += key + ": " + value[0].message + '<br/>';
        });
        $.alert({
          title: 'Error',
          content: msg,
          theme: 'modern'
        });
        setTimeout(function() {
          displaySubmitting(contactFormSubmitBtn, contactFormSubmitBtnTxt, false);
        }, 500);
      }
    })
  });


  // Auto Search
  let searchForm = $('.search-form');
  let searchInput = searchForm.find('[name="q"]');
  let searchBtn = searchForm.find('[type="submit"]');

  let typingTimer;
  let typingInterval = 500;

  searchInput.keyup(function(event) {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(performSearch, typingInterval);
  });

  searchInput.keydown(function(event) {
    clearTimeout(typingTimer);
  });

  function displaySearching() {
    searchBtn.addClass('disabled');
    searchBtn.html('<i class="fa fa-spin fa-spinner"></i> Searching...');
  }

  function performSearch() {
    displaySearching();
    let query = searchInput.val();
    setTimeout(function() {
      window.location.href='/search/?q=' + query;
    }, 1000)
  }


  // Cart and Add products
  let productForm = $('.form-product-ajax');
  productForm.submit(function(event) {
    event.preventDefault();
    let thisForm = $(this);
    let actionEndpoint = thisForm.attr('data-endpoint');
    let httpMethod = thisForm.attr('method');
    let formData = thisForm.serialize();

    $.ajax({
      url: actionEndpoint,
      method: httpMethod,
      data: formData,
      success: function(data) {
        let submitSpan = thisForm.find('.submit-span');
        if (data.added) {
          submitSpan.html('In cart <button type="submit" class="btn btn-link">Remove?</button>')
        } else {
          submitSpan.html('<button type="submit" class="btn btn-success">Add to cart</button>')
        }
        let navbarCount = $('.navbar-cart-count');
        navbarCount.text(data.cartItemCount);
        let currentPath = window.location.href;
        if (currentPath.indexOf('cart') !== -1) {
          refreshCart();
        }
      },
      error: function(errorData) {
        $.alert({
          title: 'Oops!',
          content: 'An error occurred',
          theme: 'modern'
        });
      }
    })

  });

  function refreshCart() {
    console.log('In current cart');
    let cartTable = $('.cart-table');
    let cartBody = cartTable.find('.cart-body');
    let productRows = cartBody.find('.cart-product');
    let currentUrl = window.location.href;


    let refreshCartUrl = '/api/cart/';
    let refreshCartMethod = 'GET';
    let data = {};
    $.ajax({
      url: refreshCartUrl,
      method: refreshCartMethod,
      data: data,
      success: function(data) {
        console.log('success');
        console.log(data);
        let hiddenCartItemRemoveForm = $('.cart-item-remove-form');
        let productsCount = data.products.length;
        if (productsCount > 0) {
          productRows.html('');
          $.each(data.products, function(index, value) {
            let newCartItemRemove = hiddenCartItemRemoveForm.clone();
            newCartItemRemove.css('display', 'block');
            newCartItemRemove.find('.cart-item-product-id').val(value.id);
            cartBody.prepend('<tr><th scope="row">'+ (productsCount - index) +'</th><td><a href="' + value.url  + '">' + value.name + '</a>' + newCartItemRemove.html() + '</td><td>' + value.price + '</td></tr>')
          });

          cartBody.find('.cart-subtotal').text(data.subtotal);
          cartBody.find('.cart-total').text(data.total)
        } else {
          window.location.href = currentUrl;
        }
      },
      error: function(errorData) {
        $.alert({
          title: 'Oops!',
          content: 'An error occurred',
          theme: 'modern'
        });
      }
    })
  }
})