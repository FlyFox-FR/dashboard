(function() {
    // Ermittelt den App-Namen anhand des Ordnernamens
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    // Wir nehmen den vorletzten Teil (z.B. "apps/kanban/index.html" -> "kanban")
    // Falls die Datei nicht index.html heißt, nehmen wir den Dateinamen ohne .html
    let appName = "app";
    
    if (pathSegments.length > 0) {
        let last = pathSegments[pathSegments.length - 1];
        if (last.toLowerCase() === 'index.html' || last === '') {
            if (pathSegments.length > 1) {
                appName = pathSegments[pathSegments.length - 2];
            }
        } else {
            appName = last.replace('.html', '');
        }
    }

    const PREFIX = appName + "_";
    console.log(`[Dashboard] App "${appName}" isoliert. Prefix: "${PREFIX}"`);

    const originalStorage = window.localStorage;

    const storageProxy = new Proxy(originalStorage, {
        get: function(target, prop) {
            if (prop === 'getItem') return (key) => target.getItem(PREFIX + key);
            if (prop === 'setItem') return (key, value) => target.setItem(PREFIX + key, value);
            if (prop === 'removeItem') return (key) => target.removeItem(PREFIX + key);
            if (prop === 'clear') return () => {
                Object.keys(target).forEach(key => {
                    if (key.startsWith(PREFIX)) target.removeItem(key);
                });
            };
            if (prop === 'length') return Object.keys(target).filter(k => k.startsWith(PREFIX)).length;
            if (prop === 'key') return (index) => {
                const appKeys = Object.keys(target).filter(k => k.startsWith(PREFIX));
                return appKeys[index] ? appKeys[index].substring(PREFIX.length) : null;
            };
            // Direkter Zugriff (localStorage.foo)
            const value = target[PREFIX + prop];
            if (typeof target[prop] === 'function') return target[prop].bind(target);
            return value;
        },
        set: function(target, prop, value) {
            target[PREFIX + prop] = value;
            return true;
        },
        deleteProperty: function(target, prop) {
             delete target[PREFIX + prop];
             return true;
        }
    });

    try {
        Object.defineProperty(window, 'localStorage', {
            value: storageProxy,
            configurable: true, enumerable: true, writable: true
        });
    } catch (e) {
        console.warn("Konnte localStorage nicht patchen:", e);
    }
})();
