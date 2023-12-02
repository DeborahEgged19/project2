// CACHE STORAGE
// Add the new fetchCoinData function
const fetchCoinData = async (coinId) => {
    const cacheKey = `coin_${coinId}`;
    const cache = await caches.open("coinsCache");
    const cachedResponse = await cache.match(cacheKey);
  
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      return Promise.resolve(cachedData);
    }
  
    return new Promise((resolve, reject) => {
      $.get({
        url: infoUrl.replace("{id}", coinId),
        success: (data) => {
          const response = new Response(JSON.stringify(data), {
            headers: { "Cache-Control": "max-age=120" },
          });
          cache.put(cacheKey, response);
          resolve(data);
          setTimeout(() => {
            cache.delete(cacheKey); // DELETE CACHE AFTER 2 MIN
          }, 120000);
        },
        error: (error) => {
          reject("Error while fetching details about the coin", error);
        },
      });
    });
  };
  
  const coinUrl =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false";
  const infoUrl = "https://api.coingecko.com/api/v3/coins/{id}";
  allCoins = [];
  let activeToggles = 0;
  const showAllCoins = async () => {
    const cacheName = "coin-cache";
    await checkCacheAndDelete(cacheName);
  
    const cache = await caches.open(cacheName);
    const response = await fetch(coinUrl);
    await cache.put(coinUrl, response.clone());
    allCoins = await response.json();
  
    getData();
  };
  
  const getData = () => {
    $("#container").html("");
    const sortedCoins = allCoins.sort(
      (a, b) => a.market_cap_rank - b.market_cap_rank
    );
  
    for (let counter = 0; counter < 100; counter++) {
      $("#container").append(`
                <div class="card-wrapper">
                  <div class="card" style="width: 18rem;">
                    <div class="card-body">
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch${counter}" onclick="toggleSwitch(${counter})">
                        <label class="custom-control-label" for="customSwitch${counter}"></label>
                      </div>
                      <h5 class="card-title"> ${sortedCoins[
                        counter
                      ].symbol.toUpperCase()}</h5>
                      <h6 class="card-subtitle mb-2 text-muted">${
                        sortedCoins[counter].id
                      }</h6>
                      <button class="btn btn-primary" onclick="showInfo(event, ${counter})">More Info</button>
                      <div id="coinInfo-${counter}" style="display:none;"></div>
                    </div>
                  </div>
                </div>
              `);
    }
  };
  
  const showInfo = async (event, counter) => {
    event.preventDefault();
  
    // Close other opened cards
    for (let i = 0; i < 100; i++) {
      if (i !== counter) {
        $("#coinInfo-" + i).hide();
      }
    }
  
    const coinId = allCoins[counter].id;
    const data = await $.get(infoUrl.replace("{id}", coinId));
  
    getMoreInfo(counter, data);
  };
  
  const getMoreInfo = (counter, data) => {
    $("#coinInfo-" + counter).html(`
                <p id="coinPlace"> Price In Dollars: <b> ${data.market_data.current_price.usd} $</b></p>
                <p id="coinPlace"> Price In Euros:<b>  ${data.market_data.current_price.eur} €</b></p>
                <p id="coinPlace"> Price In Shekels:<b>  ${data.market_data.current_price.ils} ₪ </b></p>
                <img id="sPicture" src=${data.image.large} width=67/><br/>
            `);
    $("#coinInfo-" + counter).toggle();
  };
  
  const selectedCoins = [];
  
  const toggleSwitch = (counter) => {
    const switchElement = $("#customSwitch" + counter);
    const coin = allCoins[counter];
  
    if (switchElement.is(":checked")) {
      if (activeToggles < 5) {
        activeToggles++;
        selectedCoins.push(coin);
      } else {
        updateModalContent();
        $("#exampleModalCenter").modal("show");
        switchElement.prop("checked", false);
      }
    } else {
      activeToggles--;
      selectedCoins.splice(selectedCoins.indexOf(coin), 1);
    }
  };
  
  const updateModalContent = () => {
    let coinList = '<ul class="list-group">';
    selectedCoins.forEach((coin, index) => {
      coinList += `<li class="list-group-item">${coin.symbol.toUpperCase()} - ${
        coin.id
      }
        <button class="btn btn-danger btn-sm float-right" onclick="removeCoin(${index})">Remove</button>
      </li>`;
    });
    coinList += "</ul>";
  
    $("#selectedCoins").html(`
  <p>You cannot choose more than 5 coins</p>
      ${coinList}
    `);
  };
  
  const filterCoins = () => {
    let searchTerm = $(".search").val().toLowerCase();
  
    if (!searchTerm) {
      $(".card").show();
      return;
    }
  
    for (let index = 0; index < allCoins.length; index++) {
      let card = $(`.card-wrapper:eq(${index}) .card`);
  
      // Check if the coin symbol starts with the search term
      if (allCoins[index].symbol.toLowerCase().startsWith(searchTerm)) {
        card.show();
      } else {
        card.hide();
      }
    }
  };
  
  $(function () {
    showAllCoins();
    $(".search").on("input", filterCoins); // Add event listener for search input
  });
  
  const checkCacheAndDelete = async (cacheName) => {
    const cacheExists = await caches.has(cacheName);
    if (cacheExists) {
      setTimeout(async () => {
        await caches.delete(cacheName);
      }, 2 * 60 * 1000); // Delete after 2 minutes
    }
  };
  
  $(".infoData").hide();
  
  $("#aboutNav").on("click", () => {
    $(".infoData").show();
    $(".coins").hide();
  });
  
  $("#home").on("click", () => {
    $(".coins").show();
    $(".infoData").hide();
  });
  
  const removeCoin = (index) => {
    const coinToRemove = selectedCoins[index];
    selectedCoins.splice(index, 1);
    activeToggles--;
  
    // Turn off the toggle of the corresponding card
    const coinIndex = allCoins.findIndex((c) => c.id === coinToRemove.id);
    $("#customSwitch" + coinIndex).prop("checked", false);
  
    updateModalContent();
  
    // Close the modal if there are no more selected coins
    if (!selectedCoins.length) {
      $("#exampleModalCenter").modal("hide");
    } else {
      $("#exampleModalCenter").modal("toggle");
    }
  };
  
  // Add event listener to navbar buttons
  $(".navbar-nav a").on("click", function (event) {
    // Prevent default navigation behavior
    event.preventDefault();
  
    // Get the section ID from the button's href attribute
    const sectionId = $(this).attr("href");
  
    // Scroll to the section
    $("html, body").animate(
      {
        scrollTop: $(sectionId).offset().top,
      },
      1000
    );
  });
  
  $(".infoData").hide();