import 'es6-promise/auto'
import 'whatwg-fetch'
import get from 'lodash.get'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import isDate from 'date-fns/is_date'
import addDays from 'date-fns/add_days'
import differenceInWeeks from 'date-fns/difference_in_weeks'
import getDay from 'date-fns/get_day'
import getDate from 'date-fns/get_date'
import getMonth from 'date-fns/get_month'
import getYear from 'date-fns/get_year'
import isAfter from 'date-fns/is_after'
import isPast from 'date-fns/is_past'
import isToday from 'date-fns/is_today'
import * as l10n from './localization'

function objectToQueryString (obj) {
  const query = Object.keys(obj)
    .filter(key => obj[key] !== '' && obj[key] !== null)
    .map(key => key + '=' + obj[key])
    .join('&')
  return query.length > 0 ? '?' + query : null
}

function successHandler (json) {
  console.log(json)
}

function errorHandler (json) {
  console.error(json)
}

function responseHandler (response, successCallback = successHandler, errorCallback = errorHandler) {
  if (response.status >= 200 && response.status < 300) {
    response.json().then(json => successCallback(json))
  }
  else {
    response.json().then(json => errorCallback(json))
  }
}

// @TODO cleanup?
function responseHandlerSimple (response, successCallback = successHandler, errorCallback = errorHandler) {
  if (response.status >= 200 && response.status < 300) {
    successCallback()
  }
  else {
    response.json().then(json => errorCallback(json))
  }
}

export function getJSON (url, successCallback, errorCallback) {
  fetch(url, {
    credentials: 'same-origin'
  })
    .then(response => responseHandler(response, successCallback, errorCallback))
}

export function postJSON (url, body, successCallback, errorCallback) {
  fetch(url, {
    credentials: 'same-origin',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
    .then(response => responseHandler(response, successCallback, errorCallback))
}

export function postParams (url, body, successCallback, errorCallback) {
  fetch(url, {
    credentials: 'same-origin',
    method: 'POST',
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body
  })
    .then(response => responseHandlerSimple(response, successCallback, errorCallback))
}

export const validateEmail = (email) => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return regex.test(email)
}

export const getEndPointUrl = (endpoint, params) => {
  let url = `${document.location.origin}/umbraco/api/${endpoint}`
  if (params) {
    const query = objectToQueryString(params)
    if (query) {
      url += query
    }
  }
  // let url = new URL(`umbraco/api/${endpoint}`, document.location.origin)
  // Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
  return url
}

export const forEach = (array, callback, scope = this) => {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, array[i], i)
  }
}

export const guid = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
}

export const formatCurrency = (number = 0, currency) => {
  // TODO: browser support.
  const locale = get(window.INITIAL_STATE, 'locale') || 'da-DK'
  const hasDigits = number % 1 !== 0
  const minimumFractionDigits = (hasDigits) ? 2 : 0
  const options = { currency, minimumFractionDigits }
  let out = number.toLocaleString(locale, options)

  if (currency) {
    out = `${currency} ${out}`
  }

  return out
}

export const formatTime = (time) => {
  if (!time) {
    return ''
  }

  return time.slice(0, 5)
}

export const formatLength = (length, unit) => {
  if (!length) {
    return ''
  }

  return length.toFixed(2) + ((unit) ? ` ${unit}` : '')
}

export const formatDate = (date, formatType = 'long') => {
  if (!date) {
    return ''
  }

  const now = (isDate(date) ? date : parse(date))
  const dateOfMonth = getDate(now)
  const day = getDay(now)
  const month = getMonth(now)
  const year = getYear(now)

  if (formatType === 'long') {
    const dayName = l10n.getDayName(getDay(now))
    const monthName = l10n.getMonthName(getMonth(now)).toLowerCase()
    return `${dayName} ${dateOfMonth}. ${monthName} ${year}`
  }
  else if (formatType === 'medium') {
    const dayName = l10n.getDayName(getDay(now)).substring(0, 3)
    const monthName = l10n.getMonthName(getMonth(now)).toLowerCase()
    return `${dayName} ${dateOfMonth}. ${monthName} ${year}`
  }
  else if (formatType === 'iso') {
    return format(now, 'YYYY-MM-DD')
  }
  else {
    return format(now, 'DD.MM.YYYY')
  }
}

export const formatMonth = (monthName) => {
  if (!monthName) {
    return ''
  }

  return monthName.slice(0, 3)
}

export const getDayItems = (fromDate, numberOfDays = 7, toDate = null) => {
  let startDate = new Date(fromDate)
  const endDate = (toDate) ? new Date(toDate) : null
  const days = []

  for (let i = 0; i < numberOfDays; i++) {
    if (!endDate || isAfter(endDate, startDate)) {
      days.push({
        pastday: isPast(startDate) && !isToday(startDate),
        today: isToday(startDate),
        name: l10n.getDayName(getDay(startDate)),
        date: getDate(startDate),
        month: l10n.getMonthName(getMonth(startDate)),
        isodate: formatDate(startDate, 'iso'),
        altMonth: (getMonth(startDate)) % 2 !== 0
      })
    }

    startDate = addDays(startDate, 1)
  }

  return days
}

export const getWeekNumbers = (startDate, numberOfWeeks = 7) => {
  let date = new Date(startDate)
  const weeksNumbers = []


  for (let i = 0; i < numberOfWeeks; i += 7) {
    weeksNumbers.push(getWeekOfYear(date))
    date = addDays(date, 7)
  }

  return weeksNumbers
}

export const getMonthNames = (startDate, days = 7) => {
  let date = new Date(startDate)
  const monthNames = []

  for (let i = 0; i < days; i++) {
    const monthName = l10n.getMonthName(getMonth(date))
    if (monthNames[monthNames.length - 1] !== monthName) {
      monthNames.push(monthName)
    }
    date = addDays(date, 1)
  }

  return monthNames
}

export const getWeekOfYear = (date) => {
  const year = getYear(date)
  const startOfYearDate = new Date(year, 0, 1)
  const weekNumber = differenceInWeeks(date, startOfYearDate) + 1
  return weekNumber
  /*
  date.setHours(0, 0, 0, 0);

  // Thursday in current week decides the year.
  date.setUTCDate(date.getUTCDate() + 3 - (date.getUTCDay() + 6) % 7);

  // January 4 is always in week 1.
  const week1 = new Date(date.getUTCFullYear(), 0, 4);

  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getUTCDay() + 6) % 7) / 7);
  */
}
