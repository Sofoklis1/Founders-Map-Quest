/**
 * Created by Sofoklis Stouraitis
 * email: sofos@aueb.gr
 */

var delimiters = { "1" : ",", "2" : ";", "3" : "\t"  };
var image_extensions = [ ".jpg", ".png", ".jpeg", ".gif", ".svg" ]; //add more image extensions here
var thumbnail_width = 50;
//var thumbnail_height = 50;

var data_headers = [];
var data_values = [];

var markers_in_map = [];
var infowindowOpen = null;

$(document).ready(function() {

    $('#submitdata').click(function(event) {

        var delimeter_choise = $('#datadelimiterchoise').val();
        var datacsv = $('#importdatafield').val();
        var count_errors = 0;

        if(delimeter_choise == 0) {
            $('#datadelimiterchoise').addClass('highlightred');
            count_errors++;
        } else {
            $('#datadelimiterchoise').removeClass('highlightred');
        }

        if(datacsv.length == 0) {
            $('#importdatafield').addClass('highlightred');
            count_errors++;
        } else {
            $('#importdatafield').removeClass('highlightred');
        }

        if(count_errors > 0) {
            return;
        }

        $('#datapreview').html('');//clear preview area
        $('#marker_settings_panel').html(''); //clear marker settings area
        data_headers = []; //clear headers
        data_values = []; //clear data

        var all_lines = $('textarea').val().split('\n');

        var preview = document.createDocumentFragment();

        var preview_table = document.createElement( "table" );
        preview_table.setAttribute("class", "table table-bordered table-responsive table-striped table-hover table-responsive");
        preview_table.setAttribute("id", "previewtable");

        var table_head = document.createElement( "thead" );
        var table_body = document.createElement( "tbody" );

        $.each( all_lines, function( i, line ) {

            var columns = line.split(delimiters[delimeter_choise]);
            var table_row = document.createElement( "tr" );
            var img, link;

            if(i == 0) {
                data_headers = columns;
            } else {
                data_values.push(columns);//no headers only data
            }

            $.each( columns, function( j, column ) {

                if(i == 0) { //header - first line

                    var header_col = document.createElement( "th" );
                    header_col.innerHTML = column;
                    table_row.appendChild(header_col);

                } else {
                    var simple_col = document.createElement( "td" );

                    if(ValidURL(column)) {

                        var isColImage = false;

                        if(isImage(column)) {
                            isColImage = true;
                            img = document.createElement( "img" );
                            img.setAttribute("src", column);
                            img.setAttribute("alt", "image display"); //mandatory attribute for images
                            img.setAttribute("width", thumbnail_width + "px;"); //restrict images width
                            //img.setAttribute("height", thumbnail_height + "px;"); //restrict images height
                            img.setAttribute("class", "customthumbnail"); //restrict images width

                            simple_col.appendChild(img);
                        }

                        if(!isColImage) { //it's a link
                            link = document.createElement( "a" );
                            link.setAttribute("href", column);
                            link.setAttribute("title", "click to view page");
                            link.setAttribute("target", "_blank"); //open in new window
                            link.innerHTML = "URL";
                            simple_col.appendChild(link);
                        }

                    } else {
                        simple_col.innerHTML = column;
                    }

                    table_row.appendChild(simple_col);
                    if(j == 0) {
                        table_row.setAttribute("id", "dataid-" + getUUID()); //add a unique id in every tr
                    }

                }//end of else

            }); //end of each

            if(i == 0) {
                table_head.appendChild(table_row);
            } else {
                table_body.appendChild(table_row);
            }

        });

        preview_table.appendChild(table_head);

        preview_table.appendChild(table_body);

        if(data_headers.length < 4) {
            $('#datapreview').append('<div class="alert alert-danger" role="alert">ERROR: Wrong delimiter or not a CSV format! Please consult our <strong><a href="help.html">help</a></strong> section.</div>');
            $('#markersettingsubmit').attr("disabled", "disabled");
            $('#datapreview').append(preview_table);
            $('#csvdatapanel').modal('show');
            return;
        }

        var tmpcount_error = 0;

        //check if every line has equal number of columns to with header
        $.each( data_values, function( i, column ) {

            if(column.length != data_headers.length) {
                tmpcount_error++;
            }

        }); //end each

        if(tmpcount_error > 0) {
            $('#datapreview').append('<div class="alert alert-danger" role="alert">ERROR: All lines does not have equal number of columns! Please consult our  <strong><a href="help.html">help</a></strong> section.</div>');
            $('#markersettingsubmit').attr("disabled", "disabled");
            $('#datapreview').append(preview_table);
            $('#csvdatapanel').modal('show');
            return;
        }

        $('#markersettingsubmit').removeAttr("disabled");

        $('#datapreview').append(preview_table);

        var select_marker_lon = document.createElement( "select" );
        select_marker_lon.setAttribute("id", "marker_lon_choise");

        var select_marker_lat = document.createElement( "select" );
        select_marker_lat.setAttribute("id", "marker_lat_choise");

        var select_marker_details = document.createElement( "select" );
        select_marker_details.setAttribute("id", "marker_details_choise");

        var select_marker_label = document.createElement( "select" );
        select_marker_label.setAttribute("id", "marker_label_choise");

        $.each( data_headers, function( i, field ) {

            var select_option = document.createElement( "option" );

            if(i == 0) {
                var select_option_null = document.createElement( "option" );
                select_option_null.setAttribute("value", 0);
                //select_option_null.setAttribute("selected", "selected");
                select_option_null.innerHTML = "-- select column --";

                select_marker_lon.appendChild(select_option_null);
                select_marker_lat.appendChild(select_option_null.cloneNode(true));
                select_marker_details.appendChild(select_option_null.cloneNode(true));
                select_marker_label.appendChild(select_option_null.cloneNode(true));
            }

            select_option.setAttribute("value", i + 1); //starting from 1 -> collumn 1 etc
            select_option.innerHTML = field;

            var lat_opt = select_option.cloneNode(true);
            var detail_opt = select_option.cloneNode(true);
            var label_opt = select_option.cloneNode(true);

            if(i == 1) { //label column
                label_opt.setAttribute("selected", "selected");
            }

            if(i == 6) { //marker details column
                detail_opt.setAttribute("selected", "selected");
            }

            if(i == 9) {//latitude column
                lat_opt.setAttribute("selected", "selected");
            }

            if(i == 10) { //longitute column
                select_option.setAttribute("selected", "selected");
            }

            select_marker_lon.appendChild(select_option);
            select_marker_lat.appendChild(lat_opt);
            select_marker_details.appendChild(detail_opt);
            select_marker_label.appendChild(label_opt);

            //select_marker_lon.appendChild(select_option);
            //select_marker_lat.appendChild(select_option.cloneNode(true));
            //select_marker_details.appendChild(select_option.cloneNode(true));
            //select_marker_label.appendChild(select_option.cloneNode(true));

        });//end each

        //start drawing marker settings
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
        $('#markersettingsubmit').click(function(event) {

            var longitude_col = $('#marker_lon_choise').val();
            var latitude_col = $('#marker_lat_choise').val();
            var marker_details_col = $('#marker_details_choise').val();
            var marker_label_col = $('#marker_label_choise').val();

            var count_incomplete = 0;

            if(longitude_col == 0) {
                $('#marker_lon_choise').addClass('highlightred');
                count_incomplete++;
            } else {
                $('#marker_lon_choise').removeClass('highlightred');
            }

            if(latitude_col == 0) {
                $('#marker_lat_choise').addClass('highlightred');
                count_incomplete++;
            } else {
                $('#marker_lat_choise').removeClass('highlightred');
            }

            if(marker_details_col == 0) {
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
            if(count_incomplete > 0) {
                return;
            }

            var table_area = preview_table.cloneNode(true);

            $('#csvdatapanel').modal('hide');
            $('#importdataform').hide();

            $('#datapreview').html(''); //clear modal table

            $('#table_data_area').html(table_area);

            var hrow = document.querySelectorAll("#previewtable thead tr")[0]; //has only one header row
            var extra_header_col = document.createElement( "th" );
            extra_header_col.setAttribute("style", "padding: 10px;"); //make size smaller
            extra_header_col.innerHTML = 'Hide';

            hrow.appendChild(extra_header_col);

            var markers = [];

            $('#previewtable tbody tr').each(function (index, element) {

                var data_row_id = $(element).attr('id').split('-')[1];
                var marker_obj = {};
                marker_obj.id = data_row_id; //asign a unique uuid as id to every marker object

                $(element).children('td').each(function (j, col) {

                    var col_value = $(col).html();

                    if(j == latitude_col - 1) {
                        marker_obj.lat = col_value;
                    }
                    if(j == longitude_col - 1) {
                        marker_obj.lon = col_value;
                    }
                    if(j == marker_details_col - 1) {
                        marker_obj.detail = col_value;
                    }
                    if(j == marker_label_col - 1) {
                        marker_obj.label = col_value;
                    }

                }); //end inner each

                markers.push(marker_obj);

                var extra_col = document.createElement( "td" );
                extra_col.setAttribute("style", "padding: 10px;");

                var input_checkbox = document.createElement( "button" );
                input_checkbox.setAttribute("type", "button");
                input_checkbox.setAttribute("class", "btn btn-primary btn-xs");
                input_checkbox.setAttribute("data-toggle", "button");
                input_checkbox.setAttribute("aria-pressed", "false");
                input_checkbox.setAttribute("autocomplete", "false");
                input_checkbox.setAttribute("id", "hide-" + data_row_id);
                input_checkbox.setAttribute("title", "Hide from map");

                var input_icon = document.createElement( "span" );
                input_icon.setAttribute("class", "glyphicon glyphicon-eye-open");
                input_checkbox.appendChild(input_icon);

                extra_col.appendChild(input_checkbox);
                element.appendChild(extra_col);

            });//end each

            $('#previewtable').DataTable( {
                "aoColumns": [ null, null, null, null, null, null, null, null, null, null, null, { "bSortable": false }  ]
            } );

            //add friendly placeholder to search input
            $('#previewtable_filter input[type="search"]').attr("placeholder", "Search table");

            drawMap(markers);

            $('button[id^="hide-"]').click(function(event) {
                var element = $(this);
                var mid = $(this).attr('id').split('-')[1];
                //console.log(mid);
                //markers_in_map
                $.each( markers_in_map, function( i, marker ) {
                    if(marker.cid === mid) {

                        if($(element).attr('aria-pressed') == 'false') {
                            marker.setVisible(false);
                            $(element).children('span').removeClass('glyphicon-eye-open');
                            $(element).children('span').addClass('glyphicon-eye-close');
                            $(element).removeClass('btn-primary');
                            $(element).addClass('btn-danger');
                            $(element).attr("title", "Show in map");

                            if(infowindowOpen.cid == marker.cid) {
                                infowindowOpen.close(); //close marker's infowindow
                            }

                        } else {
                            marker.setVisible(true);
                            $(element).children('span').removeClass('glyphicon-eye-close');
                            $(element).children('span').addClass('glyphicon-eye-open');
                            $(element).removeClass('btn-danger');
                            $(element).addClass('btn-primary');
                            $(element).attr("title", "Hide from map");
                        }

                    }
                });

            });//end hide button click

        }); ////end finish button pressed

    }); //end of submitdata

}); //end of document ready

function drawMap(markers_arr) {

    //check if valid latiture and longitute before draw map
    for (i = 0; i < markers_arr.length; i++) {
        if( isNaN(markers_arr[i].lat) || isNaN(markers_arr[i].lon) || markers_arr[i].lon < -180 || markers_arr[i].lon  > 180 || markers_arr[i].lat < -180 || markers_arr[i].lat  > 180 ) {
            $('#message_panel').html('<div class="alert alert-danger" role="alert">ERROR: Found invalid coordinates! Please consult our <strong><a href="help.html">help</a></strong> section.</div>');
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

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindowOpen.setContent(markers_arr[i].detail);
                infowindowOpen.cid = marker.cid; //use it when hide marker to hide infowindow
                infowindowOpen.open(map, marker);
            }
        })(marker, i));

        markers_in_map.push(marker);
    }

    var bounds = new google.maps.LatLngBounds ();

    for (i = 0; i < markers_arr.length; i++) {

        tmp_lating = new google.maps.LatLng (markers_arr[i].lat,markers_arr[i].lon);
        bounds.extend (tmp_lating);
    }

    map.fitBounds (bounds);

} //End of drawMap

function ValidURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if(!pattern.test(str)) {
        return false;
    } else {
        return true;
    }
} //end of ValidURL

function isImage(str) {

    for (var i = 0; i < image_extensions.length; i++) {

        var test_selector = image_extensions[i] + '$';
        var pattern = new RegExp(test_selector);

        if((pattern).test(str)) {
            return true;
        }
    }

    return false;
} //end of isImage

function getUUID() {

    var chars = '0123456789abcdef'.split('');

    var uuid = [], rnd = Math.random, r;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '_';
    uuid[14] = '4'; // version 4

    for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
            r = 0 | rnd()*16;
            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
        }
    }

    return 'uuid_' + uuid.join('');

}//end of getUUID