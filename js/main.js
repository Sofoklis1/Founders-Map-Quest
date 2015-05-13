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
var valid_lat_cols = [];
var valid_lon_cols = [];

var markers_in_map = [];
var infowindowOpen = null;

$(document).ready(function () {

    $('#submitdata').click(function (event) {

        var delimeter_choise = $('#datadelimiterchoise').val();
        var datacsv = $('#importdatafield').val();

        if (!validateUserInput(datacsv, delimeter_choise)) {
            return;
        }

        $('#datapreview').html('');//clear preview area
        $('#marker_settings_panel').hide();
        data_headers = []; //clear headers
        data_values = []; //clear data
        valid_lat_cols = [];
        valid_lon_cols = [];

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

            //skip empty line or wrong delimeter
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
                    table_row.appendChild(header_col);

                } else {

                    if (isLatitude(column)) {
                        valid_lat_cols[data_headers[j]] = true;
                    } else {
                        valid_lat_cols[data_headers[j]] = false;
                    }

                    if (isLongitide(column)) {
                        valid_lon_cols[data_headers[j]] = true;
                    } else {
                        valid_lon_cols[data_headers[j]] = false;
                    }

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
                        table_row.setAttribute("id", "dataid-" + getUUID()); //add id in every tr
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

        //we assume that we need at least 3 columns in CSV (2 for coordinates and 1 for details)
        if (data_headers.length < 3) {
            $('#datapreview').append(showErrorMessage('ERROR: Wrong delimiter or not a CSV format! Please consult our <strong><a href="help.html">Help</a></strong> section.'));
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
            $('#datapreview').append(showErrorMessage('ERROR: Corrupted CSV, lines does not have equal number of columns! Please consult our  <strong><a href="help.html">Help</a></strong> section.'));
            $('#markersettingsubmit').attr("disabled", "disabled");
            $('#datapreview').append(preview_table);
            $('#csvdatapanel').modal('show');
            return;
        }

        var count_lat_col = 0;
        var count_lon_col = 0;

        /* We need at least 2 columns that contain valid coordinates, if not => wrong CSV */
        $.each(data_headers, function (i, column) {
            //valid_lon_cols
            //valid_lat_cols

            if (valid_lat_cols[column]) {
                count_lat_col++;
            }
            if (valid_lon_cols[column]) {
                count_lon_col++;
            }

        }); //end each data_headers

        if (count_lat_col == 0) {
            $('#datapreview').append(showErrorMessage('ERROR: Could not match a column for acceptable Latitude values. Please check you CSV data.'));
            $('#markersettingsubmit').attr("disabled", "disabled");
            $('#datapreview').append(preview);
            $('#marker_settings_panel').hide();
            $('#csvdatapanel').modal('show');
            return;
        }

        if (count_lon_col == 0) {
            $('#datapreview').append(showErrorMessage('ERROR: Could not match a column for acceptable Longitude values. Please check you CSV data.'));
            $('#markersettingsubmit').attr("disabled", "disabled");
            $('#datapreview').append(preview);
            $('#marker_settings_panel').hide();
            $('#csvdatapanel').modal('show');
            return;
        }

        $('#markersettingsubmit').removeAttr("disabled");

        $('#datapreview').append(preview_table);

        /* Starting builing markers settings area */

        $('#marker_lon_choise').html('');
        $('#marker_lat_choise').html('');
        $('#marker_details_choise').html('');
        $('#marker_label_choise').html('');

        var select_option_null = createElement("option", {"value": 0}, "-- select column --");
        $('#marker_lon_choise').append(select_option_null);
        $('#marker_lat_choise').append(select_option_null.cloneNode(true));
        $('#marker_details_choise').append(select_option_null.cloneNode(true));
        $('#marker_label_choise').append(select_option_null.cloneNode(true));

        $.each(data_headers, function (i, field) {

            var select_option = createElement("option", {"value": i + 1}, field);
            var lat_opt = select_option.cloneNode(true);
            var lon_opt = select_option.cloneNode(true);
            var detail_opt = select_option.cloneNode(true);

            if (valid_lat_cols[field]) {
                if (i == 9) { //if user keeps sample.csv format, column 10 contains latitude, if not have to choose column
                    lat_opt.setAttribute("selected", "selected");
                }
                $('#marker_lat_choise').append(lat_opt);
            }

            if (valid_lon_cols[field]) {
                if (i == 10) { //if user keeps sample.csv format, column 11 contains longitude, if not have to choose column
                    lon_opt.setAttribute("selected", "selected");
                }
                $('#marker_lon_choise').append(lon_opt);
            }

            if (i == 1) { //label column
                select_option.setAttribute("selected", "selected"); //make a deafult choise for label column 2 (company)
            }

            if (i == 6) { //marker details column
                detail_opt.setAttribute("selected", "selected"); //make a deafult choise for details column 7 (street)
            }

            $('#marker_details_choise').append(detail_opt);
            $('#marker_label_choise').append(select_option);


        });//end each

        $('#markersettingsubmit').removeAttr("disabled");

        $('#marker_settings_panel').show();
        $('#csvdatapanel').modal('show'); //show data preview modal


        //finish button pressed
        $('#markersettingsubmit').click(function (event) {

            var longitude_col = $('#marker_lon_choise').val();
            var latitude_col = $('#marker_lat_choise').val();
            var marker_details_col = $('#marker_details_choise').val();
            var marker_label_col = $('#marker_label_choise').val();

            if (!validateMarkerSettings(latitude_col, longitude_col, marker_details_col, marker_label_col)) {
                return;
            }

            var table_area = preview_table.cloneNode(true);

            $('#csvdatapanel').modal('hide');
            $('#importdataform').hide();

            $('#datapreview').html(''); //clear modal table

            $('#table_data_area').html(table_area);

            var hrow = document.querySelectorAll("#previewtable thead tr")[0]; //header row

            var extra_header_col = createElement("th", {"style": "padding: 10px;"}, "");

            hrow.appendChild(extra_header_col);

            var markers = [];

            $('#previewtable tbody tr').each(function (index, element) {

                var data_row_id = $(element).attr('id').split('-')[1];
                var marker_obj = {};
                marker_obj.id = data_row_id; //assign a unique id to every marker

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

                var btn_id = "hide-" + data_row_id;

                var hidebtn = createElement("button",
                    {
                        "type": "button",
                        "class": "btn btn-primary btn-xs",
                        "data-toggle": "button",
                        "aria-pressed": "false",
                        "autocomplete": "false",
                        "id": btn_id,
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
            $('#previewtable').on('click', 'button', function (e) {
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
                            $(element).parent().parent().addClass("danger");

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
                            $(element).parent().parent().removeClass("danger");
                        }

                    }
                });

            });//end hide button click

        }); ////end finish button pressed

    }); //end of submitdata

}); //end of document ready

/**
 * Valdate marker settings in preview data panel.
 *
 * @param latval, latitude option from list
 * @param lonval, longitude option from list
 * @param detcol, details (markers infowindow) option from list
 * @param labcol, label option from list
 * @returns {boolean}
 */
function validateMarkerSettings(latval, lonval, detcol, labcol) {

    var count_incomplete = 0;

    if (lonval == 0) {
        $('#marker_lon_choise').addClass('highlightred');
        count_incomplete++;
    } else {
        $('#marker_lon_choise').removeClass('highlightred');
    }

    if (latval == 0) {
        $('#marker_lat_choise').addClass('highlightred');
        count_incomplete++;
    } else {
        $('#marker_lat_choise').removeClass('highlightred');
    }

    if (detcol == 0) {
        $('#marker_details_choise').addClass('highlightred');
        count_incomplete++;
    } else {
        $('#marker_details_choise').removeClass('highlightred');
    }

    //if marker label is mandatory uncomment the following code
    /*
     if(labcol == 0) {
     $('#marker_label_choise').addClass('highlightred');
     count_incomplete++;
     } else {
     $('#marker_label_choise').removeClass('highlightred');
     }
     */
    if (count_incomplete > 0) {
        return false;
    }

    return true;

}//end of validateMarkerSettings

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
 * @param markers_arr, an array of "temporary" markers
 */
function drawMap(markers_arr) {

    $('#map_wrapper').show();
    $('#mappage-canvas').show();

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

            marker = new MarkerWithLabel({
                position: homeLatLng,
                draggable: false,
                map: map,
                labelContent: markers_arr[i].label,
                labelAnchor: new google.maps.Point(22, 0),
                labelClass: "markerlabel", // the CSS class for the label
                labelStyle: {opacity: 1},
                cid: markers_arr[i].id
            });

        } else {

            marker = new google.maps.Marker({
                position: new google.maps.LatLng(markers_arr[i].lat, markers_arr[i].lon),
                map: map,
                cid: markers_arr[i].id
            });

        }

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                infowindowOpen.setContent(markers_arr[i].detail);
                infowindowOpen.cid = marker.cid; //use it when hide marker to hide infowindow
                infowindowOpen.open(map, marker);
            }
        })(marker, i));

        markers_in_map.push(marker);
    }

    /*
     * Fit map to markers
     */
    var bounds = new google.maps.LatLngBounds();

    for (i = 0; i < markers_arr.length; i++) {

        tmp_lating = new google.maps.LatLng(markers_arr[i].lat, markers_arr[i].lon);
        bounds.extend(tmp_lating);
    }

    map.fitBounds(bounds);

} //End of drawMap

/**
 * This function cheks if a string is a latitude coordinate
 *
 * @param str
 * @returns {boolean} true if is latitude, false otherwise
 */
function isLatitude(str) {

    if (str == "" || isNaN(str) || str > 90 || str < -90) {
        return false;
    }

    return true;

} //end of function isLatitude

/**
 * This function cheks if a string is a valid longitude coordinate
 *
 * @param str
 * @returns {boolean}, true if is longitude, false otherwise
 */
function isLongitide(str) {

    if (str == "" || isNaN(str) || str > 180 || str < -180) {
        return false;
    }

    return true;

} //end of function isLongitide

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
 * Generates a uuid, this function is used to generate id for every marker
 *
 * @returns {string}, representing the UUID (dashes are replaced by underscores)
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
    return createElement("div", {"class": "alert alert-danger text-center", "role": "alert"}, htmlmsg);
}

/**
 * Checks if user has put any content into textarea and choosed delimeter
 *
 * @param csv, csv data
 * @param delimeter
 * @returns {boolean}
 */
function validateUserInput(csv, delimeter) {
    var count_errors = 0;
    //starting fields validation
    if (delimeter == 0) {
        $('#datadelimiterchoise').addClass('highlightred');
        count_errors++;
    } else {
        $('#datadelimiterchoise').removeClass('highlightred');
    }

    if (csv.length == 0) {
        $('#importdatafield').addClass('highlightred');
        count_errors++;
    } else {
        $('#importdatafield').removeClass('highlightred');
    }

    if (count_errors > 0) {
        return false
    }

    return true;

} //end function validateUserInput