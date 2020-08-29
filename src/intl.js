var intl = {};

function Locale(locale) {
  this.language = locale.split("-")[0];
}

intl.Locale = Locale;

module.exports = intl;
