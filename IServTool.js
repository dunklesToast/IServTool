const request = require('request');
const debug = require('debug')('IServTool');
const encodeUrl = require('urlencode')


class IServTool {
    constructor(Host, user, password) {
        this.host = Host;
        this.username = user;
        this.password = password;
        this.cookies = null;
        this.cookieHeader = null;
    }

    login() {
        return new Promise((resolveLogin, rejectLogin) => {
            request.post(`https://${this.host}/iserv/login_check`, {
                form: {
                    _username: this.username,
                    _password: this.password
                }
            }, (error, response) => {
                if (error) rejectLogin(error);
                console.log(response.statusCode);
                if (!error && response.statusCode === 302) {
                    if (response.headers["set-cookie"]) {
                        let cookies = {};
                        for (let u in response.headers["set-cookie"]) {
                            if (response.headers["set-cookie"].hasOwnProperty(u)) {
                                const current = response.headers["set-cookie"][u];
                                const m = /^[^;]+/.exec(current);
                                if (m) {
                                    const CookieSplit = m[0].split("=");
                                    if (CookieSplit[0] && CookieSplit[1]) {
                                        cookies[CookieSplit[0]] = CookieSplit[1];
                                    }
                                }
                            }
                        }
                        this.cookies = cookies;
                        this._makeCookieHeaderString();
                        debug(`[DEBUG] Login successfully with user ${this.username}!`);
                        resolveLogin();
                    } else {
                        rejectLogin(new Error('There is no set-cookie Header present - Login failed.'))
                    }
                } else {
                    rejectLogin(new Error('IServ returned wrong Status Code - Login failed.'))
                }
            })
        })
    }

    //CalendarName: user cal: /<username>/home/
    //public: /+public/calendar/
    //start = startTime of events
    //end = endtime of events (also ist start und end der bereich der ausgegebenen Events)
    //IservMode = with our without ListText
    getCalendar(calendarName, start, end, iservMode) {
        return new Promise((calendarResolve, calendarReject) => {
            const iservmode = iservMode ? 'idesk' : 'null';
            calendarName = encodeUrl(calendarName);
            request(`https://${this.host}/idesk/calendar2/feed.php?cal=${calendarName}&start=${start}&end=${end}&mode=${iservmode}&_=${Date.now()}`, {
                headers: {
                    Cookie: this.cookieHeader
                },
            }, (error, response, body) => {
                if (error) calendarReject(error);
                if(response.statusCode === 302){
                    calendarResolve(body);
                }else {
                    calendarReject(new Error('IServ returned wrong Statuscode :( ' + response.statusCode));
                }
            })
        });
    }

    getServerStats() {
        return new Promise((statsResolve, statsReject) => {
            request(`https://${this.host}/idesk/info/stat/numbers/`, {
                headers: {
                    Cookie: this.cookieHeader
                },
            }, (error, response, body) => {
                if (error) statsReject(error);
                if(response.statusCode === 302){
                    statsResolve(body);
                }else {
                    statsReject(new Error('IServ returned wrong Statuscode :( ' + response.statusCode));
                }
            })
        })
    }

    _makeCookieHeaderString() {
        let cookieString = "";
        for (let CookieIndex in this.cookies) {
            if (this.cookies.hasOwnProperty(CookieIndex)) {
                cookieString = cookieString + `${CookieIndex}=${this.cookies[CookieIndex]}; `;
            }
        }
        this.cookieHeader = cookieString;
    }
}


module.exports = IServTool;