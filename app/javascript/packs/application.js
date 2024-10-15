// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

require("@rails/ujs").start()
require('../index_map.js')  // Make sure this points to the correct location


import 'expose-loader?$!jquery';
import 'bootstrap';
import '../stylesheets/application';

import '../waypoints_map.js';

let toBuffer = require('blob-to-buffer')
let AdmZip = require('adm-zip');
let parseString = require('xml2js').parseString;

// Uncomment to copy all static images under ../images to the output folder and reference
// them with the image_pack_tag helper in views (e.g <%= image_pack_tag 'rails.png' %>)
// or the `imagePath` JavaScript helper below.
//
// const images = require.context('../images', true)
// const imagePath = (name) => images(name, true)

const update_loadout_data = function() {
    if ($('#total_weight').length == 0) return

    let payload_weight = 0
    let external_fuel = 0

    $('select[id^="loadout_"]').each(function() {
        let weight = $("option:selected", this).data('weight')
        if (weight !== undefined)
            payload_weight += weight
        $('*[data-ref="' + this.id + '"]').text(weight)

        let fuel = $("option:selected", this).data('fuel')
        if (fuel !== undefined)
            external_fuel += fuel
    })
    $('#payload_weight').text(payload_weight)
    $('#external_fuel').text(external_fuel)

    let gun_percentage = $('#loadout_gun_amount').val()
    let gun_amount = Math.round(+$('#loadout_gun_amount').data('amount') * gun_percentage / 100)
    let gun_weight = Math.round(+$('#loadout_gun_amount').data('weight') * gun_percentage / 100)
    $('#gun_amount').text(gun_percentage + "% / " + gun_amount)
    $('#gun_weight').text(gun_weight)

    let fuel_percentage = $('#loadout_f').val()
    let internal_fuel = Math.round(+$('#loadout_f').data('weight') * fuel_percentage / 100)
    $('#internal_fuel').text(fuel_percentage + "% / " + internal_fuel)

    let total_fuel = external_fuel + internal_fuel
    $('#total_fuel').text(total_fuel)
    $('#fuel_weight').text(total_fuel)

    let empty_weight = $('#empty_weight').text()
    let total_weight = payload_weight + +empty_weight + gun_weight + total_fuel
    $('#total_weight').text(total_weight)
    let max_weight = $('#total_weight').data('max')
    if (total_weight > max_weight)
        $('#total_weight').addClass('bg-danger text-white')
    else
        $('#total_weight').removeClass('bg-danger text-white')
}

const update_defaults = function() {
    if ($('.update-defaults').length == 0) return
    let url = $('.update-defaults').data('defaultsUrl')
    let theater = $('#flight_theater').val()
    let callsign = $('#flight_callsign').val()
    let callsign_number = $('#flight_callsign_number').val()
    $.get(url + '?' + $.param({ t: theater, cs: callsign, n: callsign_number}), function(data) {
        if('freq' in data) {
            $('#flight_frequency').val(data['freq'])
        }
        if('group' in data) {
            $('#flight_group_id').val(data['group'])
        }
        if('laser' in data) {
            $('#flight_laser').val(data['laser'])
        }
        if('tcn' in data) {
            $('#flight_tacan_channel').val(data['tcn'])
        }
        if('iff' in data) {
            $('#flight_iff').val(data['iff'])
        }
        $('#flight_tacan_polarization').val('Y')
    })
}

const import_cf = event => {
    toBuffer(event.target.files[0], (err, buffer) => {
        if (err) throw err
        let zip = new AdmZip(buffer)
        let entry = zip.getEntry("mission.xml")
        if (entry == null) return
        let xml = zip.readAsText(entry)
        parseString(xml, (err, result) => {
            if (err) throw err
            let select = $('#routeselect')
            select.empty()
            result.Mission.Routes[0].Route.forEach(route => {
                let callsign = route.CallsignName.toString() + ' ' + route.CallsignNumber.toString()
                let val = ''
                route.Waypoints[0].Waypoint.forEach(waypoint => {
                    let name = waypoint.Name.toString()
                    let lat = waypoint.Lat.toString()
                    let lon = waypoint.Lon.toString()
                    let alt = waypoint.Altitude.toString()
                    val += '|' + name + '!' + lat + '!' + lon + '!' + alt
                })
                select.append('<option value="' + val + '">' + callsign + '</option>')
            })
            $("#importdlg").modal()
        })
    })
}

$(document).ready(function() {
    $('.dropdown-toggle').keypress(function() {
        $('.dropdown-menu').dropdown('show')
        $('.dropdown-menu').dropdown('update')
    })

    $('.update-defaults').change(update_defaults)

    $('#waypointdlg').on('shown.bs.modal', function(event) {
        let button = $(event.relatedTarget)
        $('#waypoint_name').focus()

        $('#waypoint_id').val(button.data('id'))
        $('#waypoint_insert').val(button.data('insert'))
        if (button.data('id') !== undefined && button.data('id') !== '') {
            $('#waypoint_name').val(button.data('name'))
            $('#waypoint_dme').val(button.data('dme'))
            $('#waypoint_pos').val(button.data('pos'))
            $('#waypoint_lat').val(button.data('lat'))
            $('#waypoint_lon').val(button.data('lon'))
            $('#waypoint_fmt').val(button.data('fmt'))
            $('#waypoint_prec').val(button.data('prec'))
            $('#waypoint_elev').val(button.data('elev'))
            $('#waypoint_tot').val(button.data('tot'))
        }
    })

    $('#waypoint_pos').change(function() {
        $('#waypoint_lat').val('')
        $('#waypoint_lon').val('')
    })

    $('#waypointform').submit(function(event) {
        $.post(window.location.href + '/waypoints/' + $('#waypoint_id').val(), {
            insert: $('#waypoint_insert').val(),
            name: $('#waypoint_name').val(),
            dme: $('#waypoint_dme').val(),
            pos: $('#waypoint_pos').val(),
            lat: $('#waypoint_lat').val(),
            lon: $('#waypoint_lon').val(),
            fmt: $('#waypoint_fmt').val(),
            prec: $('#waypoint_prec').val(),
            elev: $('#waypoint_elev').val(),
            tot: $('#waypoint_tot').val()
        }, function(data) {
            let id = $('#waypoint_id').val()
            if (id === '') {
                let insert_id = $('#waypoint_insert').val()
                if (insert_id === '') {
                    $('#add-waypoint').before(data)
                } else {
                    $('#waypoint_' + insert_id).before(data)
                }
            } else {
                $('#waypoint_' + id).replaceWith(data)
            }

            $('#waypoint_id').val('')
            $('#waypoint_insert').val('')
            $('#waypoint_name').val('')
            $('#waypoint_dme').val('')
            $('#waypoint_pos').val('')
            $('#waypoint_lat').val('')
            $('#waypoint_lon').val('')
            $('#waypoint_tot').val('')

            $('#waypointdlg').modal('hide')
        })
        event.preventDefault()
        return false
    })

    $('.dropdown').focusout(function(e) {
        if ($(this).has(e.relatedTarget).length === 0) {
            $('.dropdown-menu').dropdown('hide')
        }
    })

    $('#waypoint_name').keyup(function() {
        let menu = $('.dropdown-menu')
        let value = $(this).val()
        if (value.length < 2) {
            menu.dropdown('hide')
        } else {
            $.get(window.location.href + '/waypoints/?q=' + value, function(data) {
                if (data.length > 0) {
                    menu.empty()
                    data.forEach(function(value) {
                        menu.append('<a class="dropdown-item" href="#" data-dme="' + value['dme'] + '" data-pos="' + value['pos'] + '" data-lat="' + value['lat'] + '" data-lon="' + value['lon'] + '">' + value['name'] + '</a>')
                    })
                    menu.dropdown('show')
                    menu.dropdown('update')
                    $('.dropdown-item').click(function () {
                        $('#waypoint_name').val($(this).html())
                        $('#waypoint_dme').val($(this).attr('data-dme'))
                        $('#waypoint_pos').val($(this).attr('data-pos'))
                        $('#waypoint_lat').val($(this).attr('data-lat'))
                        $('#waypoint_lon').val($(this).attr('data-lon'))
                        $('#waypoint_elev').focus()
                        return false
                    })
                } else {
                    menu.dropdown('hide')
                }
            })
        }
    })

    $('select[id^="loadout_"]').change(update_loadout_data)
    $('#loadout_gun_amount').on('change mousemove', update_loadout_data)
    $('#loadout_f').on('change mousemove', update_loadout_data)
    $('form#new_loadout').submit(function() {
        $('#loadout_g').val($('#loadout_gun_amount').val() + ',' + $('#loadout_gun_type').val())
    })
    update_loadout_data()
    update_defaults()

    $('#import_cf').change(import_cf)
})
