/**
 * Created by Sofoklis Stouraitis
 * email: sofos@aueb.gr
 */

var delimiters = {"1": ",", "2": ";", "3": "\t"};
var image_extensions = [".jpg", ".png", ".jpeg", ".gif", ".svg"]; //add more image extensions here
var thumbnail_width = 50;
//var thumbnail_height = 50;
var data_headers = [];
var data_values = [];
var markers_in_map = [];
var infowindowOpen = null;

$(document).ready(function () {

    $('#submitdata').click(function (event) {

        var delimeter_choise = $('#datadelimiterchoise').val();
        var datacsv = $('#importdatafield').val();
        var count_errors = 0;

        //starting fields validation
        if (delimeter_choise == 0) {
            $('#datadelimiterchoise').addClass('highlightred');
            count_errors++;
        } else {
            $('#datadelimiterchoise').removeClass('highlightred');
        }

        if (datacsv.length == 0) {
            $('#importdatafield').addClass('highlightred');
            count_errors++;
        } else {
            $('#importdatafield').removeClass('highlightred');
        }

        if (count_errors > 0) {
            return;
        }

        $('#datapreview').html('');//clear preview area
        $('#marker_settings_panel').html(''); //clear marker settings area
        data_headers = []; //clear headers
        data_values = []; //clear data

        var all_lines = $('textarea').val().split('\n');

        var preview = document.createDocumentFragment();

        var preview_table = createElement("table", {
            "class": "table table-bordered table-responsive table-striped table-hover table-responsive",
            "id": "previewtable"
        });
        var table_head = createElement("thead");
        var table_body = createElement("tbody");

        $.each(all_lines, function (i, line) {

            var columns = line.split(delimiters[delimeter_choise]);

            //empty line or wrong delimeter
            if (columns.length == 1) {
                return true;
            }

            var table_row = createElement("tr");
            var img, link;

            if (i == 0) {
                data_headers = columns;
            } else {
                data_values.push(columns);//no headers only data
            }

            $.each(columns, function (j, column) {

                if (i == 0) { //header - first line

                    var header_col = createElement("th", null, column);
                    //header_col.innerHTML = column;
                    table_row.appendChild(header_col);

                } else {
                    var simple_col = createElement("td");

                    if (ValidURL(column)) {

                        var isColImage = false;

                        if (isImage(column)) {
                            isColImage = true;

                            img = createElement("img", {
                                "src": column,
                                "alt": "image display",
                                "width": thumbnail_width + "px;",
                                "class": "customthumbnail"
                            });
                            simple_col.appendChild(img);
                        }

                        if (!isColImage) { //it's a link
                            link = createElement("a", {
                                "href": column,
                                "title": "click to view page",
                                "target": "_blank"
                            }, "URL");
                            //link.innerHTML = "URL";
                            simple_col.appendChild(link);
                        }

                    } else {
                        simple_col.innerHTML = column;
                    }

                    table_row.appendChild(simple_col);
                    if (j == 0) {
                        table_row.setAttribute("id", "dataid-" + getUUID()); //add a unique id in every tr
                    }

                }//end of else

            }); //end of each

            if (i == 0) {
                table_head.appendChild(table_row);
            } else {
                table_body.appendChild(table_row);
            }

        });

        preview_table.appendChild(table_head);

        preview_table.appendChild(table_body);

        if (data_headers.length < 4) {
            $('#datapreview').append(showErrorMessage('ERROR: Wrong delimiter or not a CSV format! Please consult our <strong><a href="help.html">help</a></strong> section.'));
            $('#markersettingsubmit').attr("disabled", "disabled");
            $('#datapreview').append(preview_table);
            $('#csvdatapanel').modal('show');
            return;
        }

        var tmpcount_error = 0;

        //check if every line has equal number of columns to with header
        $.each(data_values, function (i, column) {

            if (column.length != data_headers.length) {
                tmpcount_error++;
            }

        }); //end each

        if (tmpcount_error > 0) {
            $('#datapreview').append(showErrorMessage('ERROR: Corrupted CSV, lines does not have equal number of columns! Please consult our  <strong><a href="help.html">help</a></strong> section.'));
            $('#markersettingsubmit').attr("disabled", "disabled");
            $('#datapreview').append(preview_table);
            $('#csvdatapanel').modal('show');
            return;
        }

        $('#markersettingsubmit').removeAttr("disabled");

        $('#datapreview').append(preview_table);

        var select_marker_lon = createElement("select", {"id": "marker_lon_choise"});
        var select_marker_lat = createElement("select", {"id": "marker_lat_choise"});
        var select_marker_details = createElement("select", {"id": "marker_details_choise"});
        var select_marker_label = createElement("select", {"id": "marker_label_choise"});

        $.each(data_headers, function (i, field) {

            if (i == 0) {

                var select_option_null = createElement("option", {"value": 0}, "-- select column --");

                select_marker_lon.appendChild(select_option_null);
                select_marker_lat.appendChild(select_option_null.cloneNode(true));
                select_marker_details.appendChild(select_option_null.cloneNode(true));
                select_marker_label.appendChild(select_option_null.cloneNode(true));
            }

            var select_option = createElement("option", {"value": i + 1}, field);
            var lat_opt = select_option.cloneNode(true);
            var detail_opt = select_option.cloneNode(true);
            var label_opt = select_option.cloneNode(true);

            if (i == 1) { //label column
                label_opt.setAttribute("selected", "selected");
            }

            if (i == 6) { //marker details column
                detail_opt.setAttribute("selected", "selected");
            }

            if (i == 9) {//latitude column
                lat_opt.setAttribute("selected", "selected");
            }

            if (i == 10) { //longitute column
                select_option.setAttribute("selected", "selected");
            }

            select_marker_lon.appendChild(select_option);
            select_marker_lat.appendChild(lat_opt);
            select_marker_details.appendChild(detail_opt);
            select_marker_label.appendChild(label_opt);

        });//end each

        //start drawing marker settings area
        $('#marker_settings_panel').append('<form><fieldset id="marker_settings"><legend>Marker Settings</legend></fieldset></form>');

        $('#marker_settings').append('<div id="marker_lat"><label for="marker_lat_choise">Latitude: </label><br> </div>');
        $('#marker_lat').append(select_marker_lat);

        $('#marker_settings').append('<div id="marker_lon"><label for="marker_lon_choise">Longitude: </label><br> </div>');
        $('#marker_lon').append(select_marker_lon);

        $('#marker_settings').append('<div id="marker_details"><label for="marker_details_choise">Point details: </label><br> </div>');
        $('#marker_details').append(select_marker_details);

        $('#marker_settings').append('<div id="marker_labels"><label for="marker_label_choise">Marker label: </label><br> </div>');
        $('#marker_labels').append(select_marker_label);

        $('#csvdatapanel').modal('show'); //show data preview modal

        //finish button pressed
        $('#markersettingsubmit').click(function (event) {

            var longitude_col = $('#marker_lon_choise').val();
            var latitude_col = $('#marker_lat_choise').val();
            var marker_details_col = $('#marker_details_choise').val();
            var marker_label_col = $('#marker_label_choise').val();

            var count_incomplete = 0;

            if (longitude_col == 0) {
                $('#marker_lon_choise').addClass('highlightred');
                count_incomplete++;
            } else {
                $('#marker_lon_choise').removeClass('highlightred');
            }

            if (latitude_col == 0) {
                $('#marker_lat_choise').addClass('highlightred');
                count_incomplete++;
            } else {
                $('#marker_lat_choise').removeClass('highlightred');
            }

            if (marker_details_col == 0) {
                $('#marker_details_choise').addClass('highlightred');
                count_incomplete++;
            } else {
                $('#marker_details_choise').removeClass('highlightred');
            }

            //if marker label is mandatory uncomment the following code
            /*
             if(marker_label_col == 0) {
             $('#marker_label_choise').addClass('highlightred');
             count_incomplete++;
             } else {
             $('#marker_label_choise').removeClass('highlightred');
             }
             */
            if (count_incomplete > 0) {
                return;
            }

            var table_area = preview_table.cloneNode(true);

            $('#csvdatapanel').modal('hide');
            $('#importdataform').hide();

            $('#datapreview').html(''); //clear modal table

            $('#table_data_area').html(table_area);

            var hrow = document.querySelectorAll("#previewtable thead tr")[0]; //has only one header row

            var extra_header_col = createElement("th", {"style": "padding: 10px;"}, "Hide");

            hrow.appendChild(extra_header_col);

            var markers = [];

            $('#previewtable tbody tr').each(function (index, element) {

                var data_row_id = $(element).attr('id').split('-')[1];
                var marker_obj = {};
                marker_obj.id = data_row_id; //assign a unique uuid as id to every marker

                $(element).children('td').each(function (j, col) {

                    var col_value = $(col).html();

                    if (j == latitude_col - 1) {
                        marker_obj.lat = col_value;
                    }
                    if (j == longitude_col - 1) {
                        marker_obj.lon = col_value;
                    }
                    if (j == marker_details_col - 1) {
                        marker_obj.detail = col_value;
                    }
                    if (j == marker_label_col - 1) {
                        marker_obj.label = col_value;
                    }

                }); //end inner each

                markers.push(marker_obj);

                var extra_col = createElement("td", {"style": "padding: 10px;"});

                var hidebtn = createElement("button",
                    {
                        "type": "button",
                        "class": "btn btn-primary btn-xs",
                        "data-toggle": "button",
                        "aria-pressed": "false",
                        "autocomplete": "false",
                        "id": "hide-" + data_row_id,
                        "title": "Click to hide from map"
                    });

                var input_icon = createElement("span", {"class": "glyphicon glyphicon-eye-open"});

                hidebtn.appendChild(input_icon);
                extra_col.appendChild(hidebtn);
                element.appendChild(extra_col);

            });//end each

            $('#previewtable').DataTable({
                "aoColumns": [null, null, null, null, null, null, null, null, null, null, null, {"bSortable": false}]
            });

            //add placeholder to search input
            $('#previewtable_filter input[type="search"]').attr("placeholder", "Search table");

            drawMap(markers);

            //button hide/show marker is pressed
            $('button[id^="hide-"]').click(function (event) {
                var element = $(this);
                var mid = $(this).attr('id').split('-')[1];

                $.each(markers_in_map, function (i, marker) {
                    if (marker.cid === mid) {

                        if ($(element).attr('aria-pressed') == 'false') {
                            marker.setVisible(false);
                            $(element).children('span').removeClass('glyphicon-eye-open');
                            $(element).children('span').addClass('glyphicon-eye-close');
                            $(element).removeClass('btn-primary');
                            $(element).addClass('btn-danger');
                            $(element).attr("title", "Click to show in map");

                            if (infowindowOpen.cid == marker.cid) {
                                infowindowOpen.close(); //close marker's infowindow
                            }

                        } else {
                            marker.setVisible(true);
                            $(element).children('span').removeClass('glyphicon-eye-close');
                            $(element).children('span').addClass('glyphicon-eye-open');
                            $(element).removeClass('btn-danger');
                            $(element).addClass('btn-primary');
                            $(element).attr("title", "Click to hide from map");
                        }

                    }
                });

            });//end hide button click

        }); ////end finish button pressed

    }); //end of submitdata

}); //end of document ready

/**
 * This function is used to create html elements with attributes and html content
 *
 * @param tagname, html tag
 * @param properties, object with all tag attributes
 * @param html, html contents
 * @returns {Element}
 */
function createElement(tagname, properties, html) {
    var tag = document.createElement(tagname);

    for (var attribute in properties) {
        tag.setAttribute(attribute, properties[attribute]);
    }
    if (!(html === undefined))
        tag.innerHTML = html;

    return tag;
}

/**
 * Draws the map
 *
 * @param markers_arr
 */
function drawMap(markers_arr) {

    //check if valid latiture and longitute before draw map
    for (i = 0; i < markers_arr.length; i++) {
        if (isNaN(markers_arr[i].lat) || isNaN(markers_arr[i].lon) || markers_arr[i].lon < -180 || markers_arr[i].lon > 180 || markers_arr[i].lat < -180 || markers_arr[i].lat > 180) {

            $('#message_panel').html(showErrorMessage('ERROR: Found invalid coordinates! Please consult our <strong><a href="help.html">help</a></strong> section.'));
            $('#message_panel').attr("style", "display: block");

            return;
        }
    }//end for

    $('#map_wrapper').attr("style", "display: block;");
    $('#mappage-canvas').attr("style", "display: block;");

    //init map using first marker
    var latLng = new google.maps.LatLng(markers_arr[0].lat, markers_arr[0].lon);

    var map = new google.maps.Map(document.getElementById('mappage-canvas'), {
        zoom: 12,
        center: latLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    infowindowOpen = new google.maps.InfoWindow;

    var marker, i;

    for (i = 0; i < markers_arr.length; i++) {

        var homeLatLng = new google.maps.LatLng(markers_arr[i].lat, markers_arr[i].lon);

        if (markers_arr[i].hasOwnProperty('label')) {

            var marker = new MarkerWithLabel({
                position: homeLatLng,
                draggable: false,
                map: map,
                labelContent: markers_arr[i].label,
                labelAnchor: new google.maps.Point(22, 0),
                labelClass: "markerlabel", // the CSS class for the label
                labelStyle: {opacity: 1}
            });

        } else {

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(markers_arr[i].lat, markers_arr[i].lon),
                map: map
            });

        }

        marker.cid = markers_arr[i].id;

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                infowindowOpen.setContent(markers_arr[i].detail);
                infowindowOpen.cid = marker.cid; //use it when hide marker to hide infowindow
                infowindowOpen.open(map, marker);
            }
        })(marker, i));

        markers_in_map.push(marker);
    }

    var bounds = new google.maps.LatLngBounds();

    for (i = 0; i < markers_arr.length; i++) {

        tmp_lating = new google.maps.LatLng(markers_arr[i].lat, markers_arr[i].lon);
        bounds.extend(tmp_lating);
    }

    map.fitBounds(bounds);

} //End of drawMap


/**
 * Checks a String if is a valid url
 *
 * @param str
 * @returns {boolean}
 * @constructor
 */
function ValidURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    if (!pattern.test(str)) {
        return false;
    } else {
        return true;
    }
} //end of ValidURL

/**
 * Check if a URL coresponts to image
 *
 * @param url
 * @returns {boolean}
 */
function isImage(url) {

    for (var i = 0; i < image_extensions.length; i++) {

        var test_selector = image_extensions[i] + '$';
        var pattern = new RegExp(test_selector);

        if ((pattern).test(url)) {
            return true;
        }
    }

    return false;
} //end of isImage

/**
 * Generates a unique uuid, this function is used to generate unique id for every marker
 *
 * @returns {string}
 */
function getUUID() {

    var chars = '0123456789abcdef'.split('');

    var uuid = [], rnd = Math.random, r;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '_';
    uuid[14] = '4'; // version 4

    for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
            r = 0 | rnd() * 16;
            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
        }
    }

    return 'uuid_' + uuid.join('');

}//end of getUUID

/**
 * Creates error alert
 *
 * @param htmlmsg, content of alert
 * @returns {Element}
 */
function showErrorMessage(htmlmsg) {
    var alert_element = createElement("div", {"class": "alert alert-danger text-center", "role": "alert"}, htmlmsg);
    return alert_element;
}